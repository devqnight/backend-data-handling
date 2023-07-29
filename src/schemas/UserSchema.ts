import { object, string, TypeOf, z} from 'zod';

/**
 * Creation User Schema : 
 *  name: mandatory and not null
 *  email: mandatory and valid
 *  password: mandatory and between 8 and 25 characters long
 *  passwordConf: mandatory, must be same as password
 */
export const createUserSchema = object({
    body: object({
        name: string({
            required_error: 'Name is required'
        }).min(1),
        email: string({
            required_error: 'Email address is required'
        }).email('Invalid email address'),
        password: string({
            required_error: 'Password is required'
        })
            .min(8, 'Password must be more than 8 characters')
            .max(25, 'Password must be lest than 25 characters'),
        passwordConf: string({
            required_error: 'Please confirm password'
        })
    }).refine((data) => data.password === data.passwordConf, {
        path: ['passwordConf'],
        message: 'Passwords do not match',
    })
});

/**
 * Change Password User Schema, for a user:
 *  oldPassword: mandatory, between 8 and 25 characters long;
 *  password: mandatory, between 8 and 25 characters long;
 *  passwordConf: mandatory, must be same as password;
 * 
 * oldPassword and password must be different.
 */
export const changePasswordUserSchema = object({
    body: object({
        oldPassword: string({
            required_error: 'Old Password is required'
        })
            .min(8, 'Password must be more than 8 characters')
            .max(25, 'Password must be lest than 25 characters'),
        password: string({
            required_error: 'Password is required'
        })
            .min(8, 'Password must be more than 8 characters')
            .max(25, 'Password must be lest than 25 characters'),
        passwordConf: string({
            required_error: 'Please confirm password'
        })
    }).superRefine((data, ctx) => {
        if(data.oldPassword === data.password) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['password'],
                message: "New password is the same as previous one"
            });
        }
        if(data.password !== data.passwordConf) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['passwordConf'],
                message: "New password do not match"
            });
        }
    })
});

/**
 * Update User Schema:
 *  name: optional, not null;
 *  email: optional, valid email;
 * 
 * User can update either name or email or both, or none
 */
export const updateUserSchema = object({
    body: object({
        name: z.optional(string().min(1)),
        email: z.optional(string().email('Invalid email address'))
    })
});

/**
 * Login User Schema:
 *  email: mandatory, must be valid;
 *  password: mandatory, must be minimum 8 characters
 */
export const loginUserSchema = object({
    body: object({
        email: string({
            required_error: 'Email address is required'
        }).email('Invalid email address'),
        password: string({
            required_error: 'Password is required'
        }).min(8, 'Invalid email or password')
    })
});

export type CreateUserInput = Omit<TypeOf<typeof createUserSchema>['body'], 'passwordConf'>;

export type UpdateUserInput = TypeOf<typeof updateUserSchema>['body'];

export type ChangePasswordUserInput = Omit<TypeOf<typeof changePasswordUserSchema>['body'], 'passwordConf'>;

export type LoginUserType = TypeOf<typeof loginUserSchema>['body'];

