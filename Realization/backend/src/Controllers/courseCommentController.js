const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");

class CourseCommentController {
  /**
   * Add a comment to a course
   * POST /course-comment
   */
  async addComment(req, res) {
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

      const { courseId, content, rating } = req.body;
      
      if (!courseId || !content || content.trim().length === 0) {
        return res.status(400).json({ message: "Course ID and content are required" });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({ message: "Comment content is too long (max 1000 characters)" });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Check if user is enrolled in the course (optional - removed for public comments)
      // const enrollment = await DbClient.enrollment.findFirst({
      //   where: {
      //     course_id: Number(courseId),
      //     user_id: decodedToken.id,
      //     approved: true
      //   }
      // });

      // if (!enrollment) {
      //   return res.status(403).json({ message: "You must be enrolled in the course to comment" });
      // }

      // Check if course exists
      const course = await DbClient.course.findUnique({
        where: { id: Number(courseId) }
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user already rated this course
      if (rating) {
        const existingRating = await DbClient.courseRating.findUnique({
          where: {
            courseId_userId: {
              courseId: Number(courseId),
              userId: decodedToken.id
            }
          }
        });

        if (existingRating) {
          return res.status(400).json({ message: "You have already rated this course. You can only rate once." });
        }
      }

      // Add comment and rating in a transaction
      const result = await DbClient.$transaction(async (prisma) => {
        // Add comment
        const comment = await prisma.courseComment.create({
          data: {
            courseId: Number(courseId),
            userId: decodedToken.id,
            content: content.trim()
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        });

        // Add or update rating if provided
        if (rating) {
          await prisma.courseRating.upsert({
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
        }

        return comment;
      });

      res.status(201).json({
        message: "Comment and rating added successfully",
        comment: result
      });

    } catch (err) {
      console.error('Add comment error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get comments for a course
   * GET /course-comment/:courseId
   */
  async getCourseComments(req, res) {
    try {
      const courseId = Number(req.params.courseId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      // Определяем текущего пользователя из токена (если передан)
      let currentUserId = null;
      try {
        const authorizationHeader = req.headers.authorization;
        if (authorizationHeader) {
          const tokenArray = authorizationHeader.split(" ");
          if (tokenArray.length === 2) {
            const token = tokenArray[1];
            const decoded = jwt.verify(token, process.env.SECRET);
            currentUserId = decoded?.id || null;
          }
        }
      } catch (_) {}
      
      const comments = await DbClient.courseComment.findMany({
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
          },
          reactions: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      // Get ratings for each comment and aggregate reactions
      const commentsWithRatings = await Promise.all(
        comments.map(async (comment) => {
          const rating = await DbClient.courseRating.findUnique({
            where: {
              courseId_userId: {
                courseId: courseId,
                userId: comment.userId
              }
            }
          });
          const likes = comment.reactions?.filter(r => r.type === 'like').length || 0;
          const dislikes = comment.reactions?.filter(r => r.type === 'dislike').length || 0;
          const myReaction = currentUserId ? (comment.reactions?.find(r => r.userId === currentUserId)?.type || null) : null;
          
          return {
            ...comment,
            rating: rating ? rating.rating : null,
            likes,
            dislikes,
            myReaction
          };
        })
      );

      const totalComments = await DbClient.courseComment.count({
        where: {
          courseId: courseId
        }
      });

      res.json({
        comments: commentsWithRatings,
        pagination: {
          page: page,
          limit: limit,
          total: totalComments,
          totalPages: Math.ceil(totalComments / limit)
        }
      });

    } catch (err) {
      console.error('Get course comments error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Update a comment
   * PUT /course-comment/:commentId
   */
  async updateComment(req, res) {
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

      const commentId = Number(req.params.commentId);
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({ message: "Comment content is too long (max 1000 characters)" });
      }

      // Check if comment exists and belongs to user
      const existingComment = await DbClient.courseComment.findFirst({
        where: {
          id: commentId,
          userId: decodedToken.id
        }
      });

      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found or you don't have permission to edit it" });
      }

      // Update comment
      const updatedComment = await DbClient.courseComment.update({
        where: {
          id: commentId
        },
        data: {
          content: content.trim(),
          isEdited: true,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      res.json({
        message: "Comment updated successfully",
        comment: updatedComment
      });

    } catch (err) {
      console.error('Update comment error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Delete a comment
   * DELETE /course-comment/:commentId
   */
  async deleteComment(req, res) {
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

      const commentId = Number(req.params.commentId);

      // Check if comment exists and belongs to user or user is admin
      const existingComment = await DbClient.courseComment.findFirst({
        where: {
          id: commentId,
          userId: decodedToken.id
        }
      });

      const isAdmin = decodedToken.roles && decodedToken.roles.includes("ADMIN");

      if (!existingComment && !isAdmin) {
        return res.status(404).json({ message: "Comment not found or you don't have permission to delete it" });
      }

      // Delete comment
      await DbClient.courseComment.delete({
        where: {
          id: commentId
        }
      });

      res.json({
        message: "Comment deleted successfully"
      });

    } catch (err) {
      console.error('Delete comment error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get comment count for a course
   * GET /course-comment/:courseId/count
   */
  async getCommentCount(req, res) {
    try {
      const courseId = Number(req.params.courseId);
      
      const count = await DbClient.courseComment.count({
        where: {
          courseId: courseId
        }
      });

      res.json({ count: count });

    } catch (err) {
      console.error('Get comment count error:', err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new CourseCommentController(); 