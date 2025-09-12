const { PrismaClient } = require("@prisma/client");

async function testDatabase() {
  const db = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await db.$connect();
    console.log('Database connection successful');
    
    // Check if there are any lessons
    const lessons = await db.lecture.findMany();
    console.log(`Found ${lessons.length} lessons in database:`);
    lessons.forEach(lesson => {
      console.log(`- Lesson ID: ${lesson.id}, Name: ${lesson.name}, Course ID: ${lesson.course_id}, Module ID: ${lesson.moduleId}`);
    });
    
    // Check if there are any courses
    const courses = await db.course.findMany();
    console.log(`\nFound ${courses.length} courses in database:`);
    courses.forEach(course => {
      console.log(`- Course ID: ${course.id}, Name: ${course.name}`);
    });
    
    // Check if there are any users
    const users = await db.user.findMany();
    console.log(`\nFound ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`- User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Check specific lesson with ID 1
    const lesson1 = await db.lecture.findUnique({ where: { id: 1 } });
    console.log(`\nLesson with ID 1:`, lesson1);
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testDatabase(); 