<!--- Provide a general summary of your code in the Title above -->

## Description

Completed the Node.js Task Management API final project and added several backend enhancements.
The application includes user registration, logon, and logoff, along with protected CRUD operations for tasks. It uses Node.js, Express, PostgreSQL, and Prisma ORM.
Additional functionality includes task priorities, pagination, filtering and sorting, bulk task creation, analytics, advanced task search, and a Trash Bin with soft delete, restore, and permanent delete functionality.
The application also includes authentication, authorization, CSRF protection, input validation, security middleware, and automated testing.

## Context

This project demonstrates the development of a complete REST API with persistent PostgreSQL storage, secure authentication, validation, testing, and cloud deployment.
The additional features extend the basic CRUD functionality and provide more realistic task-management capabilities. The Trash Bin prevents tasks from being permanently deleted immediately and allows users to restore them when needed.

## How has this been tested?

The application was tested using Jest and Supertest for automated testing and Postman for manual API testing.

Testing includes:

- User registration, logon, and logoff
- Protected routes and authentication
- Task creation, retrieval, update, and deletion
- Input validation and error handling
- Task ownership and access control
- Pagination and filtering
- Bulk task creation
- Trash Bin, task restoration, and permanent deletion
- Analytics and advanced task search
  The deployed API was also tested on Render with a PostgreSQL database.

## Screenshots (if appropriate):

N/A
