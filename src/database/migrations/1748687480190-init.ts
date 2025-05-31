import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1748687480190 implements MigrationInterface {
    name = 'Init1748687480190'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First drop the existing enum if it exists
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum" CASCADE`);
        
        // Create the enum with CUSTOMER role
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ORDER_MANAGER', 'ACCOUNTANT', 'MANAGER', 'CEO', 'ADMIN', 'CUSTOMER')`);
        
        // Create other enums
        await queryRunner.query(`CREATE TYPE "public"."users_center_enum" AS ENUM('KAHAMA', 'SHINYANGA', 'MAGANZO')`);
        await queryRunner.query(`CREATE TYPE "public"."documents_documenttype_enum" AS ENUM('INVOICE', 'PAYMENT_RECEIPT', 'DELIVERY_RECEIPT', 'EXPENSE_RECEIPT', 'REFUND_RECEIPT')`);
        await queryRunner.query(`CREATE TYPE "public"."approvals_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_type_enum" AS ENUM('PURCHASE', 'SERVICE', 'CONSULTING', 'REQUEST')`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('PENDING', 'MANAGER_APPROVED', 'APPROVED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'ACCOUNTANT_APPROVED', 'MANAGER_APPROVED', 'APPROVED', 'CANCELLED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INVOICED')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('READ', 'UNREAD')`);
        await queryRunner.query(`CREATE TYPE "public"."stock_items_type_enum" AS ENUM('SASSO_CHICKS', 'BROILER_CHICKS', 'FEED')`);
        await queryRunner.query(`CREATE TYPE "public"."stock_items_status_enum" AS ENUM('PENDING', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'APPROVED')`);
        await queryRunner.query(`CREATE TYPE "public"."sales_paymenttype_enum" AS ENUM('CASH', 'LOAN')`);
        await queryRunner.query(`CREATE TYPE "public"."customers_sex_enum" AS ENUM('MALE', 'FEMALE')`);
        await queryRunner.query(`CREATE TYPE "public"."customers_center_enum" AS ENUM('KAHAMA', 'SHINYANGA', 'MAGANZO')`);
        await queryRunner.query(`CREATE TYPE "public"."chicken_orders_type_of_chicken_enum" AS ENUM('SASSO', 'BROILER')`);
        await queryRunner.query(`CREATE TYPE "public"."chicken_orders_payment_status_enum" AS ENUM('PAID', 'PARTIAL', 'UNPAID')`);
        await queryRunner.query(`CREATE TYPE "public"."feed_orders_feed_type_enum" AS ENUM('BROILER_STARTER_MP', 'BROILER_STARTER_MV', 'BROILER_GROWER_MP', 'BROILER_GROWER_MV', 'BROILER_STARTER', 'BROILER_GROWER', 'BROILER_FINISHER', 'LAYER_STARTER', 'LAYER_GROWER', 'COMPLETE_LAYER_MASH', 'BACKBONE_LAYER_STARTER', 'BACKBONE_LAYER_GROWER', 'BACKBONE_COMPLETE_LAYER_MASH', 'LOCAL_FEED')`);
        await queryRunner.query(`CREATE TYPE "public"."feed_orders_company_enum" AS ENUM('ARVINES', 'SILVERLAND', 'BACKBONE', 'LOCAL')`);
        await queryRunner.query(`CREATE TYPE "public"."chicken_stock_chickentype_enum" AS ENUM('SASSO', 'BROILER')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all enums in reverse order
        await queryRunner.query(`DROP TYPE "public"."chicken_stock_chickentype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."feed_orders_company_enum"`);
        await queryRunner.query(`DROP TYPE "public"."feed_orders_feed_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chicken_orders_payment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chicken_orders_type_of_chicken_enum"`);
        await queryRunner.query(`DROP TYPE "public"."customers_center_enum"`);
        await queryRunner.query(`DROP TYPE "public"."customers_sex_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sales_paymenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."stock_items_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."stock_items_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."approvals_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documents_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_center_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
} 