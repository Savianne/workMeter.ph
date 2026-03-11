"use client"
import React from "react";
import { styled } from '@mui/material/styles';
import { signIn, useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { IStyledFC } from "../types/IStyledFC";
import { maskEmail } from "../helpers/maskEmail";
import useConfirmModal from "../components/ConfirmModal/useConfirmModal";
import ConfirmModal from "../components/ConfirmModal/ConfirmModal";
import doApiRequest from "../helpers/doApiRequest";
import { object, string, ValidationError } from 'yup';
import LoginWithGoogleBtn from "../login/LoginWithGoogleBtn";
import debounce from "lodash/debounce";
import { useRouter, usePathname } from "next/navigation";

//MUI Components
import { 
    Paper,
    TextField,
    Divider,
    Button,
    Alert,
    Box,
    Avatar,
    AlertTitle
} from "@mui/material";
import { enqueueSnackbar } from "notistack";


const StyledSignUpPage = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        min-height: 100vh;
        padding: 50px 15px;
        gap: 50px;
        align-items: center;
        justify-content: center;

        > .form-container {
            position: relative;
            display: flex;
            flex: 0 1 500px;
            min-height: 650px;
            height: fit-content;
            align-items: center;
            justify-content: center;
            align-content: flex-start;
            padding: 20px 50px;
            gap: 15px;
            flex-wrap: wrap;

            > h6 {
                flex: 0 1 100%;
                text-align: center;
            }
        }

        > .system-info {
            display: flex;
            flex: 0 1 500px;
            min-height: 500px;
            flex-wrap: wrap;
            justify-content: center;
            height: fit-content;

            > h2, > h3, > h5 {
                text-align: center;
                max-width: 500px;
            }

            > h2 {
                color: #39F;
            }
            > h3 {
                flex: 0 1 100%;
                max-width: 100%;
            }

            > h5 {
                margin-bottom: 30px;
            }

            > .attendance-image-container {
                width: 100%;
                height: 200px;
                border-radius: 10px;
                overflow: hidden;

                 > .attendance-image {
                    width: 100%;
                    height: 100%;
                    background-image: url(/images/attendance2.jpg);
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: cover;
                }
            }

            > .attendance-image-container:hover > .attendance-image {
                transition: transform 400ms ease-in-out;
                transform: scale(1.1);
            }
        }

        @media screen and (max-width: 1000px) {
            flex-direction: column;
            padding: 30px;

            > .divider {
                display: none;
            }

            > .form-container {
                order: 2;
                /* padding: 20px; */
            }

            > .system-info {
                order: 1;
            }
        }

        @media screen and (max-width: 500px) {
            > .form-container {
                padding: 20px;
            }
        }
    }
`;

const ValidateFormSchema = object({
    username: string()
        .min(5, "At least 5 characters")
        .max(20, "Too long")
        .matches(/^(?=.*[A-Za-z])[A-Za-z0-9_]+$/, "Must contain at least one letter and only letters, numbers, or underscore")
        .required("Username is required"),
    email: string().email('Invalid email address').required('Email is required'),
    password: string()
        .min(8, "Minimum 8 characters")
        .matches(/[a-z]/, "Must contain at least one lowercase letter")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/[0-9]/, "Must contain at least one number")
        .matches(/[@$!%*?&]/, "Must contain at least one special character")
        .required(),
});

const LoginPage: React.FC<IStyledFC> = () => {
    const nextRouter = useRouter();
    const {modal, confirm} = useConfirmModal();
    const [error, setError] = React.useState<null | string>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [values, setValues] = React.useState({username: "", email: "", password: ""});
    const [retypePassword, setRetypePassword] = React.useState("");
    const [formReady, setFormReady] = React.useState(false);
    const [inputValidationError, setInputValidationError] = React.useState<{
        userName: string | null,
        email: string | null,
        password: string | null
    }>({
        userName: null,
        email: null,
        password: null
    });

    const handleSignup = async (e: any) => {
        e.preventDefault();
        confirm(
            `To verify email ownership, we’ll send a verification link to ${values.email} to complete your WorkMeter account setup. The link will expire in 5 minutes. Click Confirm to continue`,
            async () => {
                doApiRequest(
                    "/api/post/sign-up/generate-pending-signup-token",
                    (data) =>{ 
                        enqueueSnackbar("Please check your inbox to verify your signup.", {variant: 'success', anchorOrigin: {vertical: "top", horizontal: "center"}});
                        setValues({email: "", username: "", password: ""});
                        setRetypePassword("");
                        if(error) setError(null);
                    
                    },
                    (state) => setIsLoading(state),
                    (error) => setError(error.message),
                    {
                        method: "POST",
                        body: JSON.stringify({...values})
                    }
                )
            }
        )
    };

    const handleInputValidation = React.useMemo(
        () => 
        debounce(async (scheme: () => Promise<any>, onInvalid: (error: string) => void, onValid: () => void) => {
            try {
                await scheme();
                onValid();
            }
            catch(err) {
                if (err instanceof ValidationError) {
                    onInvalid(err.message)
                }
            }
        }, 500), 
    []);

    React.useEffect(() => {
        (async () => {
            try {
                await ValidateFormSchema.validate({...values});
                return setFormReady(true);
            }
            catch(err) {
                return setFormReady(false);
            }
        })()
    }, [values])
    return(
        <StyledSignUpPage>
            <ConfirmModal context={modal} />
            <Box className="system-info">
                <div className="attendance-image-container">
                    <Box className="attendance-image" />
                </div>
                <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><g mask="url(#a)"><path d="M22.74 27.73v-7.6l6.64-3.79v7.6l-6.64 3.79Z" fill="#007FFF"></path><path d="M16.1 23.93v-7.59l6.64 3.8v7.59l-6.65-3.8Z" fill="#39F"></path><path d="m16.1 16.34 6.64-3.8 6.64 3.8-6.64 3.8-6.65-3.8Z" fill="#A5D8FF"></path></g><mask id="b" maskUnits="userSpaceOnUse" x="8" y="17" width="14" height="15" style={{maskType: "alpha"}}><path d="M8.5 22.3c0-1.05.56-2 1.46-2.53l3.75-2.14c.89-.5 1.98-.5 2.87 0l3.75 2.14a2.9 2.9 0 0 1 1.46 2.52v4.23c0 1.04-.56 2-1.46 2.52l-3.75 2.14c-.89.5-1.98.5-2.87 0l-3.75-2.14a2.9 2.9 0 0 1-1.46-2.52v-4.23Z" fill="#D7DCE1"></path></mask><g mask="url(#b)"><path d="M15.14 32v-7.6l6.65-3.8v7.6L15.14 32Z" fill="#007FFF"></path><path d="M8.5 28.2v-7.6l6.64 3.8V32L8.5 28.2Z" fill="#39F"></path><path d="m8.5 20.6 6.64-3.79 6.65 3.8-6.65 3.8-6.64-3.8Z" fill="#A5D8FF"></path></g><mask id="c" maskUnits="userSpaceOnUse" x="8" y="4" width="22" height="20" style={{maskType: "alpha"}}><path d="M24.17 4.82a2.9 2.9 0 0 0-2.87 0L9.97 11.22a2.9 2.9 0 0 0-1.47 2.53v4.22c0 1.04.56 2 1.46 2.52l3.75 2.14c.89.5 1.98.5 2.87 0l11.33-6.42a2.9 2.9 0 0 0 1.47-2.52V9.48c0-1.04-.56-2-1.46-2.52l-3.75-2.14Z" fill="#D7DCE1"></path></mask><g mask="url(#c)"><path d="M15.14 23.46v-7.6L29.38 7.8v7.59l-14.24 8.07Z" fill="#007FFF"></path><path d="M8.5 19.66v-7.6l6.64 3.8v7.6l-6.64-3.8Z" fill="#39F"></path><path d="M8.5 12.07 22.74 4l6.64 3.8-14.24 8.06-6.64-3.8Z" fill="#A5D8FF"></path></g></svg>
                <h2>WorkMeter v1.0</h2>
                <h3>Employee Attendance Monitoring and Payroll System</h3>
                <h5>Track attendance effortlessly, streamline payroll automatically. Employee Attendance Monitoring and Payroll System V.0.1 gives your workplace the power to manage time, performance, and payouts with accuracy and zero hassle.</h5>
                {/* <SignUpBtn onClick={() => {}} label="SIGN-UP NOW"></SignUpBtn> */}
            </Box>
            <Divider className="divider" orientation="vertical" variant="middle" flexItem/>
            <Paper component={'form'} className="form-container">
                <h3>SIGN-UP</h3>
                {
                    error? 
                    <Alert sx={{flex: '0 1 100%'}} variant="filled" severity="error">
                        {error}
                    </Alert> : ""
                }
                <TextField 
                type="username"
                label="Username"
                variant="outlined"
                sx={{flex: '0 1 100%'}}
                error={!!inputValidationError.userName}
                helperText={inputValidationError.userName}
                value={values.username}
                disabled={isLoading}
                required
                onChange={(e) => {
                    setValues({...values, username: e.target.value});
                    handleInputValidation(() => string().min(5, "At least 5 characters").max(20, "Too long").matches(/^(?=.*[A-Za-z])[A-Za-z0-9_]+$/, "Must contain at least one letter and only letters, numbers, or underscore").required("Username is required").validate(e.target.value), (error) => setInputValidationError({...inputValidationError, userName: error}), () => setInputValidationError({...inputValidationError, userName: null}))
                }}
                />
                <TextField 
                type="email"
                label="Email"
                variant="outlined"
                sx={{flex: '0 1 100%'}}
                disabled={isLoading}
                error={!!inputValidationError.email}
                helperText={inputValidationError.email}
                value={values.email}
                required
                onChange={(e) => {
                    setValues({...values, email: e.target.value});
                    handleInputValidation(() => string().email('Invalid email address').required('Email is required').validate(e.target.value), (error) => setInputValidationError({...inputValidationError, email: error}), () => setInputValidationError({...inputValidationError, email: null}))
                }}
                />
                <TextField 
                label="Password"
                type="password"
                variant="outlined"
                sx={{flex: '0 1 100%'}}
                error={!!inputValidationError.password}
                helperText={inputValidationError.password}
                value={values.password}
                disabled={isLoading}
                required
                onChange={(e) => {
                    setValues({...values, password: e.target.value});
                    handleInputValidation(() => string().min(8, "Minimum 8 characters").matches(/[a-z]/, "Must contain at least one lowercase letter").matches(/[A-Z]/, "Must contain at least one uppercase letter").matches(/[0-9]/, "Must contain at least one number").matches(/[@$!%*?&]/, "Must contain at least one special character").required().validate(e.target.value), (error) => setInputValidationError({...inputValidationError, password: error}), () => setInputValidationError({...inputValidationError, password: null}))
                }}
                />
                <TextField 
                label="Retype password"
                variant="outlined"
                type="password"
                disabled={isLoading}
                sx={{flex: '0 1 100%'}}
                helperText={""}
                required
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                />
                <Button loading={isLoading} disabled={!(formReady && values.password == retypePassword)} variant="contained" fullWidth onClick={handleSignup}>Sign-up</Button>
                <h6>Or</h6>
                <LoginWithGoogleBtn />
                <Button onClick={() => nextRouter.push('/login')} fullWidth>Go to Login</Button>
            </Paper>
        </StyledSignUpPage>
    )
}

export default LoginPage;