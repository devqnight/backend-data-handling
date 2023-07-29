import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BaseEntity } from "typeorm"
const bcrypt = require('bcryptjs');

@Entity('users')
export class User extends BaseEntity{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({
        unique: true
    })
    email: string

    @Column()
    password: string

    /**
     * Returns the User without the password displayed
     * @returns User object without password
     */
    toJSON() {
        return {...this, password: undefined};
    }

    /**
     * Encrypts password before storing in DB
     */
    @BeforeInsert()
    async hashPassword(){
        this.password = await bcrypt.hash(this.password,15);
    }

    /**
     * Compare user input password to existing hashed password 
     * @param clearPassword Password that is entered by the user
     * @param hashedPassword Hashed password stored in DB
     * @returns 
     */
    static async comparePasswords(
        clearPassword: string,
        hashedPassword: string
    ) {
        return await bcrypt.compare(clearPassword, hashedPassword);
    }
}


