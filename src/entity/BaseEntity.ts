import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdOn: Date;
    
    @UpdateDateColumn()
    updateOn: Date;

    @Column({nullable: false, default: true})
    deleted: boolean;
    
    @Column({nullable: false, default: true})
    isActive: boolean;
}