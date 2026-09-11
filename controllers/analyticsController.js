const prisma = require("../db/prisma");

async function getUserAnalytics(req, res, next) {
  try {
    // Parse and validate user ID

    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Count tasks by completion status
    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    // Get 10 most recent tasks with user information
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Calculate date from 7 days ago
    const oneWeekAgo = new Date();

    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Group tasks created during the last 7 days
    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    return res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    return next(err);
  }
}

async function getUsersWithStats(req, res, next) {
  try {
    // Parse pagination parameters (similar to how you did in the task index method in section 3 above)
    // Hint: Parse page and limit from req.query, calculate skip
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users with task counts using _count aggregation
    // Note: In Prisma, you need to use include for relations, then transform the result
    const usersRaw = await prisma.user.findMany({
      include: {
        tasks: {
          where: {
            isCompleted: false,
          },
          select: {
            id: true,
          },
          take: 5,
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to only include the fields we want
    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: {
        Task: user._count.tasks,
      },
      Task: user.tasks,
    }));

    // Get total count for pagination
    const totalUsers = await prisma.user.count();

    // Build pagination object with page, limit, total, pages, hasNext, hasPrev
    // Hint: Use Math.ceil() for pages, compare page * limit with total for hasNext
    const pagination = {
      page: page,
      limit: limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1,
    };
    // Return users and pagination
    return res.status(200).json({
      users,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
}

async function searchTasks(req, res, next) {
  try {
    const searchQuery = req.query.q;
    // Validate search query
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }
    // Get limit from query (default to 20)
    const limit = parseInt(req.query.limit) || 20;
    const trimmedQuery = searchQuery.trim();

    // Construct search patterns outside the query for proper parameterization
    const searchPattern = `%${trimmedQuery}%`;
    const exactMatch = trimmedQuery;
    const startsWith = `${trimmedQuery}%`;

    // Use raw SQL for complex text search with parameterized queries
    const searchResults = await prisma.$queryRaw`
      SELECT
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    // Return results with query and count
    // Hint: The test expects results array, query string, and count number
    return res.status(200).json({
      results: searchResults,
      query: trimmedQuery,
      count: searchResults.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
};
