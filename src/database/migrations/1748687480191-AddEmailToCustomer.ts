import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailToCustomer1748687480191 implements MigrationInterface {
    name = 'AddEmailToCustomer1748687480191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "email" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "email"`);
    }
} 