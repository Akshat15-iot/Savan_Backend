const swaggerJsdoc = require('swagger-jsdoc');
const ip = require('ip');

const options = {
 definition: {
   openapi: '3.0.0',
   info: {
     title: 'Real Estate LMS + CRM API',
     version: '1.0.0',
     description: 'API documentation for Real Estate LMS + CRM + Property Buying & Selling Platform',
     contact: {
       name: 'API Support',
       email: 'support@realestate.com'
     }
   },
   servers: [
     {
       // url: 'http://localhost:5000',
       url: `http://${ip.address()}:5002`||'http://localhost:5002',
       description: 'Development server',
     },
   ],
   components: {
     securitySchemes: {
       bearerAuth: {
         type: 'http',
         scheme: 'bearer',
         bearerFormat: 'JWT',
       }
     },
     schemas: {
       User: {
         type: 'object',
         properties: {
           _id: { type: 'string', example: '5f8d04b3ab35de3d342acd4f' },
           name: { type: 'string', example: 'John Doe' },
           email: { type: 'string', format: 'email', example: 'john@example.com' },
           password: { type: 'string', format: 'password', writeOnly: true },
           role: {
             type: 'string',
             enum: ['admin', 'subadmin-lms', 'subadmin-accountant', 'salesperson', 'user'],
             example: 'user'
           },
           phone: { type: 'string', example: '+1234567890' },
           isActive: { type: 'boolean', example: true },
           lastLogin: { type: 'string', format: 'date-time' },
           createdAt: { type: 'string', format: 'date-time' },
           updatedAt: { type: 'string', format: 'date-time' },
         },
       },
       Lead: {
         type: 'object',
         properties: {
           _id: { type: 'string', example: '5f8d04b3ab35de3d342acd50' },
           name: { type: 'string', example: 'Jane Smith' },
           email: { type: 'string', format: 'email', example: 'jane@example.com' },
           phone: { type: 'string', example: '+1234567891' },
           source: {
             type: 'string',
             enum: ['website', 'referral', 'social_media', 'cold_call', 'walk_in', 'other'],
             example: 'website'
           },
           status: {
             type: 'string',
             enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'],
             example: 'new'
           },
           budget: {
             min: { type: 'number', example: 100000 },
             max: { type: 'number', example: 500000 }
           },
           propertyType: {
             type: 'string',
             enum: ['apartment', 'house', 'villa', 'commercial', 'land', 'other'],
             example: 'apartment'
           },
           location: { type: 'string', example: 'Downtown' },
           requirements: { type: 'string', example: 'Looking for a 3BHK apartment' },
           notes: [
             {
               text: { type: 'string' },
               createdBy: { type: 'string', example: '5f8d04b3ab35de3d342acd4f' },
               createdAt: { type: 'string', format: 'date-time' }
             }
           ],
           assignedTo: {
             type: 'string',
             example: '5f8d04b3ab35de3d342acd4f',
             description: 'Reference to User ID'
           },
           isActive: { type: 'boolean', default: true },
           createdAt: { type: 'string', format: 'date-time' },
           updatedAt: { type: 'string', format: 'date-time' },
         },
       },
       Project: {
         type: 'object',
         properties: {
           _id: { type: 'string', example: '5f8d04b3ab35de3d342acd51' },
           name: { type: 'string', example: 'Sunrise Apartments' },
           description: { type: 'string', example: 'Luxury apartments with modern amenities' },
           location: { type: 'string' },
           price: { type: 'number' },
           status: { type: 'string', enum: ['available', 'sold', 'reserved'] },
           images: { type: 'array', items: { type: 'string' } },
           createdAt: { type: 'string', format: 'date-time' },
           updatedAt: { type: 'string', format: 'date-time' },
         },
       },
       Payment: {
         type: 'object',
         properties: {
           _id: { type: 'string' },
           amount: { type: 'number' },
           type: { type: 'string', enum: ['receipt', 'payment'] },
           description: { type: 'string' },
           projectId: { type: 'string' },
           createdAt: { type: 'string', format: 'date-time' },
           updatedAt: { type: 'string', format: 'date-time' },
         }
       },
       Error: {
         type: 'object',
         properties: {
           success: { type: 'boolean', example: false },
           message: { type: 'string', example: 'Error message' },
           errors: {
             type: 'array',
             items: { type: 'string' },
             example: ['Validation error details']
           }
         }
       },
       ActivityLog: {
         type: 'object',
         properties: {
           _id: { type: 'string', example: '64e5e7b8e2f3b2b6f9d8c9e1' },
           userId: {
             type: 'object',
             properties: {
               _id: { type: 'string' },
               fullName: { type: 'string' },
               email: { type: 'string' },
               role: { type: 'string' }
             }
           },
           role: { type: 'string', enum: ['Admin', 'SubAdmin', 'Salesperson', 'User'] },
           method: { type: 'string' },
           endpoint: { type: 'string' },
           action: { type: 'string' },
           description: { type: 'string' },
           ipAddress: { type: 'string' },
           userAgent: { type: 'string' },
           createdAt: { type: 'string', format: 'date-time' }
         }
       },
       Success: {
         type: 'object',
         properties: {
           success: { type: 'boolean', example: true },
           data: { type: 'object' }
         }
       }
     },
   },
   paths: {
     '/api/v1/auth/client-login': {
       post: {
         tags: ['Authentication'],
         summary: 'Login for non-admin users',
         description: 'Login endpoint for users with role other than admin or subadmin',
         requestBody: {
           required: true,
           content: {
             'application/json': {
               schema: {
                 type: 'object',
                 required: ['email', 'password'],
                 properties: {
                   email: { type: 'string', format: 'email', example: 'user@example.com' },
                   password: { type: 'string', format: 'password', example: 'password123' }
                 }
               }
             }
           }
         },
         responses: {
           200: {
             description: 'Login successful',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     success: { type: 'boolean', example: true },
                     token: { type: 'string', example: 'jwt.token.here' },
                     user: { $ref: '#/components/schemas/User' }
                   }
                 }
               }
             }
           },
           400: { $ref: '#/components/responses/BadRequest' },
           403: {
             description: 'Forbidden - Admin/Subadmin trying to use client login',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     message: { type: 'string', example: 'Please use the admin portal to login' }
                   }
                 }
               }
             }
           },
           500: { $ref: '#/components/responses/ServerError' }
         },
         security: []
       }
     },
     '/api/v1/auth/register': {
       post: {
         tags: ['Authentication'],
         summary: 'Register a new user',
         description: 'Register a new user. Public endpoint for user role, requires authentication for other roles.',
         requestBody: {
           required: true,
           content: {
             'multipart/form-data': {
               schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'role'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', format: 'password', minLength: 6, example: 'password123' },
                    role: {
                      type: 'string',
                      enum: ['admin', 'subadmin-lms', 'subadmin-accountant', 'salesperson', 'user'],
                          example: 'salesperson'
                    },
                  phone: { type: 'string', example: '+1234567890' },
                    address: { type: 'string', example: '123 Main St, City, State' },
                    location: { type: 'string', example: 'Location' },
                  designation: { type: 'string', example: 'Sales Executive' },
                  profilePhoto: { type: 'string', format: 'binary', description: 'Profile photo file' }
                 }
               }
             }
         },
         responses: {
           201: {
             description: 'User registered successfully',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     success: { type: 'boolean', example: true },
                     token: { type: 'string', example: 'jwt.token.here' },
                     user: { $ref: '#/components/schemas/User' }
                   }
                 }
               }
             }
           },
           400: { $ref: '#/components/responses/BadRequest' },
           401: { $ref: '#/components/responses/Unauthorized' },
           500: { $ref: '#/components/responses/ServerError' }
         },
         security: [] // No auth required for user registration
       }
     },
'/auth/login': {
 post: {
   tags: ['Authenticationz'],
   summary: 'User login',
   description: 'Authenticates a user and returns a JWT token if credentials are valid.',
   requestBody: {
     required: true,
     content: {
       'application/json': {
         schema: {
           type: 'object',
           properties: {
             email: {
               type: 'string',
               format: 'email',
               example: 'user@example.com'
             },
             password: {
               type: 'string',
               format: 'password',
               example: 'yourpassword'
             }
           },
           required: ['email', 'password']
         }
       }
     }
   },
   responses: {
     200: {
       description: 'Successful login',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               token: { type: 'string', description: 'JWT token' },
               user: { $ref: '#/components/schemas/User' }
             }
           }
         }
       }
     },
     401: { description: 'Invalid credentials' },
     400: { description: 'Bad request' }
   }
 }
},
     '/api/v1/users': {
       get: {
         tags: ['Users'],
         summary: 'Get all users',
         security: [{ bearerAuth: [] }],
         responses: {
           200: {
             description: 'List of users',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     success: { type: 'boolean' },
                     data: {
                       type: 'array',
                       items: { $ref: '#/components/schemas/User' }
                     }
                   }
                 }
               }
             }
           },
           401: { $ref: '#/components/responses/Unauthorized' },
           403: { $ref: '#/components/responses/Forbidden' },
           500: { $ref: '#/components/responses/ServerError' }
         }
       },
       post: {
         tags: ['Users'],
         summary: 'Create a new user',
         security: [{ bearerAuth: [] }],
         requestBody: {
           required: true,
           content: {
             'application/json': {
               schema: {
                 $ref: '#/components/schemas/User'
               }
             }
           }
         },
         responses: {
           201: {
             description: 'User created successfully',
             content: {
               'application/json': {
                 schema: {
                   $ref: '#/components/schemas/User'
                 }
               }
             }
           },
           400: { $ref: '#/components/responses/BadRequest' },
           401: { $ref: '#/components/responses/Unauthorized' },
           500: { $ref: '#/components/responses/ServerError' }
         }
       }
     },
     '/api/v1/leads': {
       get: {
         tags: ['Leads'],
         summary: 'Get all leads',
         security: [{ bearerAuth: [] }],
         parameters: [
           {
             name: 'status',
             in: 'query',
             schema: { type: 'string' },
             description: 'Filter by lead status'
           },
           {
             name: 'source',
             in: 'query',
             schema: { type: 'string' },
             description: 'Filter by lead source'
           },
           {
             name: 'page',
             in: 'query',
             schema: { type: 'integer', default: 1 },
             description: 'Page number'
           },
           {
             name: 'limit',
             in: 'query',
             schema: { type: 'integer', default: 10 },
             description: 'Items per page'
           }
         ],
         responses: {
           200: {
             description: 'List of leads',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     leads: {
                       type: 'array',
                       items: { $ref: '#/components/schemas/Lead' }
                     },
                     totalPages: { type: 'integer' },
                     currentPage: { type: 'integer' },
                     total: { type: 'integer' }
                   }
                 }
               }
             }
           },
           401: { $ref: '#/components/responses/Unauthorized' },
           500: { $ref: '#/components/responses/ServerError' }
         }
       },
       post: {
         tags: ['Leads'],
         summary: 'Create a new lead',
         security: [{ bearerAuth: [] }],
         requestBody: {
           required: true,
           content: {
             'application/json': {
               schema: {
                 $ref: '#/components/schemas/Lead'
               }
             }
           }
         },
         responses: {
           201: {
             description: 'Lead created successfully',
             content: {
               'application/json': {
                 schema: {
                   $ref: '#/components/schemas/Lead'
                 }
               }
             }
           },
           400: { $ref: '#/components/responses/BadRequest' },
           401: { $ref: '#/components/responses/Unauthorized' },
           500: { $ref: '#/components/responses/ServerError' }
         }
       }
     },
     '/api/v1/user/reports/sales-performance': {
       get: {
         tags: ['Reports'],
         summary: 'Get sales performance report',
         security: [{ bearerAuth: [] }],
         parameters: [
           {
             name: 'startDate',
             in: 'query',
             schema: { type: 'string', format: 'date' },
             description: 'Start date for the report (YYYY-MM-DD)'
           },
           {
             name: 'endDate',
             in: 'query',
             schema: { type: 'string', format: 'date' },
             description: 'End date for the report (YYYY-MM-DD)'
           },
           {
             name: 'userId',
             in: 'query',
             schema: { type: 'string' },
             description: 'Filter by user ID'
           }
         ],
         responses: {
           200: {
             description: 'Sales performance report',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     success: { type: 'boolean' },
                     data: {
                       type: 'object',
                       properties: {
                         conversionRate: { type: 'number' },
                         totalLeads: { type: 'integer' },
                         convertedLeads: { type: 'integer' },
                         leadsByStatus: {
                           type: 'array',
                           items: {
                             type: 'object',
                             properties: {
                               _id: { type: 'string' },
                               count: { type: 'integer' }
                             }
                           }
                         },
                         leadsBySource: {
                           type: 'array',
                           items: {
                             type: 'object',
                             properties: {
                               _id: { type: 'string' },
                               count: { type: 'integer' }
                             }
                           }
                         },
                         monthlyTrend: {
                           type: 'array',
                           items: {
                             type: 'object',
                             properties: {
                               _id: {
                                 year: { type: 'integer' },
                                 month: { type: 'integer' }
                               },
                               count: { type: 'integer' }
                             }
                           }
                         }
                       }
                     }
                   }
                 }
               }
             }
           },
           401: { $ref: '#/components/responses/Unauthorized' },
           500: { $ref: '#/components/responses/ServerError' }
         }
       }
     }
   },
   responses: {
     BadRequest: {
       description: 'Bad request',
       content: {
         'application/json': {
           schema: {
             $ref: '#/components/schemas/Error'
           },
           example: {
             success: false,
             message: 'Validation error',
             errors: ['Name is required']
           }
         }
       }
     },
     Unauthorized: {
       description: 'Unauthorized',
       content: {
         'application/json': {
           schema: {
             $ref: '#/components/schemas/Error'
           },
           example: {
             success: false,
             message: 'Not authorized to access this route'
           }
         }
       }
     },
     Forbidden: {
       description: 'Forbidden',
       content: {
         'application/json': {
           schema: {
             $ref: '#/components/schemas/Error'
           },
           example: {
             success: false,
             message: 'Not authorized to perform this action'
           }
         }
       }
     },
     NotFound: {
       description: 'Not Found',
       content: {
         'application/json': {
           schema: {
             $ref: '#/components/schemas/Error'
           },
           example: {
             success: false,
             message: 'Resource not found'
           }
         }
       }
     },
    
     ServerError: {
       description: 'Server Error',
       content: {
         'application/json': {
           schema: {
             $ref: '#/components/schemas/Error'
           },
           example: {
             success: false,
             message: 'Server error',
             error: 'Error message'
           }
         }
       }
     }
   }
 },
},
apis: ['./routes/*.js'], 
};


const specs = swaggerJsdoc(options);


module.exports = specs;
