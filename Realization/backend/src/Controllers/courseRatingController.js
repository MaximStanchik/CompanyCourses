const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");

class CourseRatingController {
  /**
   * Add or update a course rating
   * POST /course-rating
   */
  async addOrUpdateRating(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const { courseId, rating } = req.body;
      
      if (!courseId || !rating) {
        return res.status(400).json({ message: "Course ID and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Check if user is enrolled in the course (optional - removed for public ratings)
      // const enrollment = await DbClient.enrollment.findFirst({
      //   where: {
      //     course_id: Number(courseId),
      //     user_id: decodedToken.id,
      //     approved: true
      //   }
      // });

      // if (!enrollment) {
      //   return res.status(403).json({ message: "You must be enrolled in the course to rate it" });
      // }

      // Check if course exists
      const course = await DbClient.course.findUnique({
        where: { id: Number(courseId) }
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user already rated this course
      const existingRating = await DbClient.courseRating.findUnique({
        where: {
          courseId_userId: {
            courseId: Number(courseId),
            userId: decodedToken.id
          }
        }
      });

      // Add or update rating
      const courseRating = await DbClient.courseRating.upsert({
        where: {
          courseId_userId: {
            courseId: Number(courseId),
            userId: decodedToken.id
          }
        },
        update: {
          rating: Number(rating),
          updatedAt: new Date()
        },
        create: {
          courseId: Number(courseId),
          userId: decodedToken.id,
          rating: Number(rating)
        }
      });

      const message = existingRating ? "Rating updated successfully" : "Rating added successfully";

      res.json({
        message: message,
        rating: courseRating
      });

    } catch (err) {
      console.error('Course rating error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get course rating by user
   * GET /course-rating/:courseId or GET /course/:courseId/rating/:userId
   */
  async getUserRating(req, res) {
    try {
      const courseId = Number(req.params.courseId);
      let userId;

      // Если userId передан в URL, используем его
      if (req.params.userId) {
        userId = Number(req.params.userId);
      } else {
        // Иначе получаем из токена
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
          return res.status(401).json({ message: "Authorization header missing" });
        }
        
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length !== 2) {
          return res.status(401).json({ message: "Invalid authorization format" });
        }
        
        const token = tokenArray[1];
        let decodedToken;
        try {
          decodedToken = jwt.verify(token, process.env.SECRET);
        } catch (err) {
          return res.status(401).json({ message: "Invalid token" });
        }
        
        userId = decodedToken.id;
      }
      
      const rating = await DbClient.courseRating.findUnique({
        where: {
          courseId_userId: {
            courseId: courseId,
            userId: userId
          }
        }
      });

      res.json({ rating: rating ? rating.rating : null });

    } catch (err) {
      console.error('Get user rating error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get course average rating and count
   * GET /course-rating/:courseId/stats
   */
  async getCourseRatingStats(req, res) {
    try {
      const courseId = Number(req.params.courseId);
      
      const stats = await DbClient.courseRating.aggregate({
        where: {
          courseId: courseId
        },
        _avg: {
          rating: true
        },
        _count: {
          rating: true
        }
      });

      res.json({
        averageRating: stats._avg.rating || 0,
        totalRatings: stats._count.rating || 0
      });

    } catch (err) {
      console.error('Get course rating stats error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get all ratings for a course (admin only)
   * GET /course-rating/:courseId/all
   */
  async getAllCourseRatings(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json({ message: "You don't have enough rights" });
      }

      const courseId = Number(req.params.courseId);
      
      const ratings = await DbClient.courseRating.findMany({
        where: {
          courseId: courseId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(ratings);

    } catch (err) {
      console.error('Get all course ratings error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new CourseRatingController(); 