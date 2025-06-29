import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import * as nodemailer from 'nodemailer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:4000', 'https://manage.spade.co.tz'], // Add your allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('SpaDe API')
    .setDescription('SpaDe Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('customers', 'Customer management endpoints')
    .addTag('products', 'Product/Inventory management endpoints')
    .addTag('sales', 'Sales management endpoints')
    .addTag('orders', 'Order management endpoints')
    .addTag('requests', 'Request form management endpoints')
    .addTag('chicken-stock', 'Chicken stock management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Add custom schema for request form example
  document.components.schemas['RequestFormExample'] = {
    type: 'object',
    properties: {
      taskType: { type: 'string', example: 'Services' },
      employeeName: { type: 'string', example: 'John Doe' },
      employeeTitle: { type: 'string', example: 'Manager' },
      employeeAddress: { type: 'string', example: '123 Main St' },
      employeePhone: { type: 'string', example: '+255123456789' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            itemNumber: { type: 'number', example: 1 },
            description: { type: 'string', example: 'Item description' },
            quantity: { type: 'number', example: 1 },
            unitPrice: { type: 'number', example: 100 },
            totalPrice: { type: 'number', example: 100 }
          }
        }
      },
      spadeEmployee: { type: 'string', example: 'Jane Doe' }
    }
  };

  // Add custom schema for chicken stock examples
  document.components.schemas['ChickenStockExample'] = {
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      chickenType: { type: 'string', enum: ['SASSO', 'BROILER'], example: 'SASSO' },
      currentQuantity: { type: 'number', example: 1000 },
      totalReceived: { type: 'number', example: 5000 },
      totalSold: { type: 'number', example: 4000 },
      minimumStock: { type: 'number', example: 100 },
      createdAt: { type: 'string', format: 'date-time', example: '2024-02-20T12:00:00Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2024-02-20T12:00:00Z' }
    }
  };

  document.components.schemas['AddStockExample'] = {
    type: 'object',
    properties: {
      quantity: { type: 'number', example: 1000, minimum: 1 }
    }
  };

  document.components.schemas['UpdateMinimumStockExample'] = {
    type: 'object',
    properties: {
      minimumStock: { type: 'number', example: 100, minimum: 0 }
    }
  };

  // Add custom schema for request status update example
  document.components.schemas['UpdateRequestStatusExample'] = {
    type: 'object',
    properties: {
      status: { 
        type: 'string', 
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'INVOICED'],
        example: 'APPROVED'
      },
      comments: { 
        type: 'string', 
        example: 'Request approved for processing',
        nullable: true
      }
    }
  };

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3
    },
    customCss: `
      /* .swagger-ui .topbar { display: none } */
      .swagger-ui .scheme-container { display: none }
      .swagger-ui .servers { display: none }
      .swagger-ui .information-container { margin-bottom: 30px }
      .swagger-ui .information-container .info { margin-bottom: 0 }
      .swagger-ui .information-container .info .title { color: #3b4151 }
      .swagger-ui .information-container .info .description { margin-bottom: 15px }
    `,
    customSiteTitle: 'SpaDe API Documentation'
  });

  // Log all registered routes
  const server = app.getHttpServer();
  const router = server._events.request._router;
  console.log('Registered Routes:');
  router.stack.forEach((layer) => {
    if (layer.route) {
      const path = layer.route?.path;
      const method = layer.route?.stack[0].method.toUpperCase();
      console.log(`${method} ${path}`);
    }
  });

  await app.listen(3000);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'watuguludenis@gmail.com',
      pass: 'xgiq xlbz ntch wtim',
    },
  });

  (async () => {
    try {
      const info = await transporter.sendMail({
        from: '"SpaDe" <watuguludenis@gmail.com>',
        to: 'watuguludenis@gmail.com',
        subject: 'Order Approved',
        text: 'Your order has been approved!',
      });
      console.log('Email sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  })();
}

bootstrap();
