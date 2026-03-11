"use client"
import React, { Suspense} from "react";
import { styled } from '@mui/material/styles';
import { signIn, useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { IStyledFC } from "../types/IStyledFC";
import { maskEmail } from "../helpers/maskEmail";
import doApiRequest from "../helpers/doApiRequest";
import { object, string, date, mixed } from 'yup';
import { enqueueSnackbar } from 'notistack';
import LoginWithGoogleBtn from "./LoginWithGoogleBtn";
import SignInWithGoogleBtn from "./SignInWithGoogle";
import { useRouter, usePathname } from "next/navigation";
import SignUpBtn from "../components/SignupBtn";

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


const StyledLoginPage = styled(Box)`
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
            min-height: 550px;
            height: fit-content;
            align-items: center;
            justify-content: center;
            align-content: flex-start;
            padding: 20px 50px;
            gap: 15px;
            flex-wrap: wrap;

            > .pending-login-info {
                display: flex;
                flex: 0 1 100%;
                height: fit-content;
                padding: 10px;
                gap: 10px;
                align-items: center;
                justify-content: center;
                /* flex-direction: column; */
            }

            > .logo {
                display: flex;
                flex: 0 1 100%;
                justify-content: center;
                align-items: center;
                position: absolute;
                bottom: 30px;

                > h2 {
                    color: #39F;
                }
            }

            > h6 {
                flex: 0 1 100%;
                text-align: center;
            }
        }

        > .system-info {
            display: flex;
            flex: 0 1 500px;
            min-height: 550px;
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

const ValidateEmailSchema = object({
  email: string().email('Invalid email address').required('Email is required'),
});

const LoginPage: React.FC<IStyledFC> = () => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams?.get('callbackUrl');
    const nextRouter = useRouter();
    const [error, setError] = React.useState<null | string>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [values, setValues] = React.useState({username: "", password: ""});
    const [pendingLogin, setPendingLogin] = React.useState<{email: string, userName: string, uid: string} | null>(null);
    const [onRemovePendingLogin, setOnRemovePendingLogin] = React.useState(false);
    const [sendingResetLink, setSendingResetLink] = React.useState(false);
    const [findingAccount, setFindingAccount] = React.useState(false);
    const [findingAccountError, setFindingAccountError] = React.useState<null | string>(null);
    const [view, setView] = React.useState<"login" | "forgot-password">("login");
    const [email, setEmail] = React.useState("");
    const [emailValidationError, setEmailValidationError] = React.useState<null | string>(null);
    const [timeLeft, setTimeLeft] = React.useState(0);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if(view == "login") {
            setIsLoading(true);
    
            const res = await signIn("credentials", {
                redirect: false,
                username: pendingLogin? pendingLogin.email : values.username,
                password: values.password
            });
    
            if (res?.error) {
                setError(res.error);
                setIsLoading(false);
                if(res.error == "LOGIN_WRONG_PASS") {
                    doApiRequest<[{ email: string, userName: string, uid: string }]>(
                        "/api/get/get-pending-login",
                        (data) => setPendingLogin(data[0]), 
                        (s) => {}, 
                        (s) => {}, 
                    );
                }
            };
    
            if(res?.ok) redirect(callbackUrl? callbackUrl : '/');
        }
    };

    const handleSendResetLink = async () => {
        await doApiRequest<{next_req_time: Date}>(
            "/api/post/send-reset-link", 
            (data) => {
                enqueueSnackbar("Check your inbox for the password reset link. It will expire in 5 minutes.", {variant: 'success', anchorOrigin: {vertical: "top", horizontal: "center"}});
                setTimeLeft(Math.ceil((new Date(data.next_req_time).getTime() - Date.now()) / 1000));
            },
            (state) => setSendingResetLink(state),
            (error) => {
                enqueueSnackbar(error.message, {variant: 'error', anchorOrigin: {vertical: "top", horizontal: "center"}});
            },
            {
                method: "POST",
                body: JSON.stringify({...pendingLogin})
            }
        )
    }

    const handleFindAccount = async () => {
        try {
            await ValidateEmailSchema.validate({email});
            if(emailValidationError) setEmailValidationError(null);

            await doApiRequest<{ email: string, userName: string, uid: string }>(
                "/api/post/find-account",
                (data) => {
                    setPendingLogin(data);
                    setError(null);
                    if(findingAccountError) setFindingAccountError(null);
                }, 
                (state) => setFindingAccount(state),
                (err) => setFindingAccountError(err.message), 
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({email})
                }
            );
        }
        catch (e:any) {
            setEmailValidationError(e.errors? e.errors : 'Please check your input properly');
        }
    }


    const removePendingLogin = async (e:any) => {
        await doApiRequest<{success: boolean}>(
            "/api/delete/remove-pending-login",
            (data) => setPendingLogin(null), 
            (state) => setOnRemovePendingLogin(state),
            (err) => {}, 
            {
                method: "DELETE"
            }
        );
    }

    React.useEffect(() => {
        doApiRequest<[{ email: string, userName: string, uid: string }]>(
            "/api/get/get-pending-login",
            (data) => setPendingLogin(data[0]), 
            (s) => {}, 
            (err) => {}, 
        );
    }, [])

    React.useEffect(() => {
        if(pendingLogin?.uid) {
            doApiRequest<[{date: Date}]>(
                "/api/post/get-account-reset-link-delay-duration",
                (data) => { 
                    if(data.length) {
                        setTimeLeft(Math.ceil((new Date(data[0].date).getTime() - Date.now()) / 1000));
                    } else {
                        setTimeLeft(0);
                    }
                },
                (state) => {setSendingResetLink(state)},
                (error) => {},
                {
                    method: "POST",
                    body: JSON.stringify({uid: pendingLogin?.uid})
                }
            )
        }
    }, [pendingLogin]);

    React.useEffect(() => {
        if (timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timeLeft]);

    return(
        <StyledLoginPage>
            <Paper component={'form'} onSubmit={handleSubmit} className="form-container">
                {
                    view == "login"? <>
                        <h3>LOG-IN</h3>
                        {
                            error == "LOGIN_NO_USER"? <Alert sx={{flex: '0 1 100%'}} variant="filled" severity="error">
                            No account found with this email/username.
                            </Alert> : ""
                        }
                        {
                            pendingLogin? <>
                                <Box className="pending-login-info">
                                    <Avatar variant="rounded" alt={pendingLogin.userName} sx={{ width: "80px", height: "80px" }} />
                                    <Box component={"div"}>
                                        <h5 style={{marginLeft: '10px'}}>{pendingLogin.userName}</h5>
                                        <Button loading={onRemovePendingLogin} loadingPosition="start" fullWidth onClick={removePendingLogin}>Not you?</Button>
                                    </Box>
                                </Box>
                            </> : 
                            <TextField 
                            sx={{
                                '& input:-webkit-autofill': {
                                WebkitBoxShadow: '0 0 0 1000px #a9e8fb60 inset',
                                WebkitTextFillColor: '#000',
                                transition: 'background-color 9999s ease-in-out 0s',
                                },
                            }}
                            value={values.username} onChange={(e) => setValues({...values, username: e.target.value})} label="Email/Username" variant="filled" fullWidth />
                        }
                        <TextField 
                        sx={{
                            '& input:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 1000px #a9e8fb60 inset',
                            WebkitTextFillColor: '#000',
                            transition: 'background-color 9999s ease-in-out 0s',
                            },
                        }}
                        error={error == "LOGIN_WRONG_PASS"} helperText={error == "LOGIN_WRONG_PASS"? "Wrong password" : undefined} value={values.password} onChange={(e) => setValues({...values, password: e.target.value})} label="Password" type="password" variant="filled" fullWidth  />
                        <Button loading={isLoading} loadingPosition="end" type="submit" variant="contained" fullWidth>Log-in</Button>
                        <h6>Or</h6>
                        <LoginWithGoogleBtn />
                        {/* <SignInWithGoogleBtn /> */}
                        <Button fullWidth onClick={() => setView("forgot-password")}>Forgot password?</Button>
                    </> : <>
                        <h3>Forgot Password</h3>
                        {
                            pendingLogin? <>
                                <Box className="pending-login-info">
                                    <Avatar variant="rounded" alt={pendingLogin.userName} sx={{ width: "80px", height: "80px" }} />
                                    <Box component={"div"}>
                                        <h5 style={{marginLeft: '10px'}}>{pendingLogin.userName}</h5>
                                        <Button loading={onRemovePendingLogin} loadingPosition="start" fullWidth onClick={removePendingLogin}>Not you?</Button>
                                    </Box>
                                </Box>
                                <Alert severity="info">
                                    <AlertTitle>Info</AlertTitle>
                                    A password reset link will be sent to your email: {maskEmail(pendingLogin.email)}
                                </Alert>
                                <Button onClick={() => setView("login")}>Enter Password</Button>
                                <Button loading={sendingResetLink} disabled={timeLeft > 0} loadingPosition="end" variant="contained" onClick={handleSendResetLink}>{timeLeft > 0? `Wait ${timeLeft} seconds` : "Send Link"}</Button>
                            </> : <>
                                {
                                    findingAccountError? 
                                    <Alert severity="error">
                                        {findingAccountError}
                                    </Alert> : 
                                    <Alert severity="info">
                                        <AlertTitle>Info</AlertTitle>
                                        Enter the email associated with your account. We’ll use it to help you recover access.
                                    </Alert>
                                }
                                <TextField
                                error={!!emailValidationError}
                                helperText={emailValidationError}
                                label="Email Address" 
                                variant="filled" fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{
                                    '& input:-webkit-autofill': {
                                    WebkitBoxShadow: '0 0 0 1000px #a9e8fb60 inset',
                                    WebkitTextFillColor: '#000',
                                    transition: 'background-color 9999s ease-in-out 0s',
                                    },
                                }} />
                                <Button loading={findingAccount} loadingPosition="end" variant="contained" fullWidth onClick={handleFindAccount}>Find your Account</Button>
                                <Button onClick={() => setView("login")} fullWidth>Back to login</Button>
                            </>
                        }
                    </>
                }
                <div className="logo">
                    <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><g mask="url(#a)"><path d="M22.74 27.73v-7.6l6.64-3.79v7.6l-6.64 3.79Z" fill="#007FFF"></path><path d="M16.1 23.93v-7.59l6.64 3.8v7.59l-6.65-3.8Z" fill="#39F"></path><path d="m16.1 16.34 6.64-3.8 6.64 3.8-6.64 3.8-6.65-3.8Z" fill="#A5D8FF"></path></g><mask id="b" maskUnits="userSpaceOnUse" x="8" y="17" width="14" height="15" style={{maskType: "alpha"}}><path d="M8.5 22.3c0-1.05.56-2 1.46-2.53l3.75-2.14c.89-.5 1.98-.5 2.87 0l3.75 2.14a2.9 2.9 0 0 1 1.46 2.52v4.23c0 1.04-.56 2-1.46 2.52l-3.75 2.14c-.89.5-1.98.5-2.87 0l-3.75-2.14a2.9 2.9 0 0 1-1.46-2.52v-4.23Z" fill="#D7DCE1"></path></mask><g mask="url(#b)"><path d="M15.14 32v-7.6l6.65-3.8v7.6L15.14 32Z" fill="#007FFF"></path><path d="M8.5 28.2v-7.6l6.64 3.8V32L8.5 28.2Z" fill="#39F"></path><path d="m8.5 20.6 6.64-3.79 6.65 3.8-6.65 3.8-6.64-3.8Z" fill="#A5D8FF"></path></g><mask id="c" maskUnits="userSpaceOnUse" x="8" y="4" width="22" height="20" style={{maskType: "alpha"}}><path d="M24.17 4.82a2.9 2.9 0 0 0-2.87 0L9.97 11.22a2.9 2.9 0 0 0-1.47 2.53v4.22c0 1.04.56 2 1.46 2.52l3.75 2.14c.89.5 1.98.5 2.87 0l11.33-6.42a2.9 2.9 0 0 0 1.47-2.52V9.48c0-1.04-.56-2-1.46-2.52l-3.75-2.14Z" fill="#D7DCE1"></path></mask><g mask="url(#c)"><path d="M15.14 23.46v-7.6L29.38 7.8v7.59l-14.24 8.07Z" fill="#007FFF"></path><path d="M8.5 19.66v-7.6l6.64 3.8v7.6l-6.64-3.8Z" fill="#39F"></path><path d="M8.5 12.07 22.74 4l6.64 3.8-14.24 8.06-6.64-3.8Z" fill="#A5D8FF"></path></g></svg>
                    <h2>WorkMeter</h2>
                </div>
            </Paper>
            <Divider className="divider" orientation="vertical" variant="middle" flexItem/>
            <Box className="system-info">
                <div className="attendance-image-container">
                    <Box className="attendance-image" />
                </div>
                <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><g mask="url(#a)"><path d="M22.74 27.73v-7.6l6.64-3.79v7.6l-6.64 3.79Z" fill="#007FFF"></path><path d="M16.1 23.93v-7.59l6.64 3.8v7.59l-6.65-3.8Z" fill="#39F"></path><path d="m16.1 16.34 6.64-3.8 6.64 3.8-6.64 3.8-6.65-3.8Z" fill="#A5D8FF"></path></g><mask id="b" maskUnits="userSpaceOnUse" x="8" y="17" width="14" height="15" style={{maskType: "alpha"}}><path d="M8.5 22.3c0-1.05.56-2 1.46-2.53l3.75-2.14c.89-.5 1.98-.5 2.87 0l3.75 2.14a2.9 2.9 0 0 1 1.46 2.52v4.23c0 1.04-.56 2-1.46 2.52l-3.75 2.14c-.89.5-1.98.5-2.87 0l-3.75-2.14a2.9 2.9 0 0 1-1.46-2.52v-4.23Z" fill="#D7DCE1"></path></mask><g mask="url(#b)"><path d="M15.14 32v-7.6l6.65-3.8v7.6L15.14 32Z" fill="#007FFF"></path><path d="M8.5 28.2v-7.6l6.64 3.8V32L8.5 28.2Z" fill="#39F"></path><path d="m8.5 20.6 6.64-3.79 6.65 3.8-6.65 3.8-6.64-3.8Z" fill="#A5D8FF"></path></g><mask id="c" maskUnits="userSpaceOnUse" x="8" y="4" width="22" height="20" style={{maskType: "alpha"}}><path d="M24.17 4.82a2.9 2.9 0 0 0-2.87 0L9.97 11.22a2.9 2.9 0 0 0-1.47 2.53v4.22c0 1.04.56 2 1.46 2.52l3.75 2.14c.89.5 1.98.5 2.87 0l11.33-6.42a2.9 2.9 0 0 0 1.47-2.52V9.48c0-1.04-.56-2-1.46-2.52l-3.75-2.14Z" fill="#D7DCE1"></path></mask><g mask="url(#c)"><path d="M15.14 23.46v-7.6L29.38 7.8v7.59l-14.24 8.07Z" fill="#007FFF"></path><path d="M8.5 19.66v-7.6l6.64 3.8v7.6l-6.64-3.8Z" fill="#39F"></path><path d="M8.5 12.07 22.74 4l6.64 3.8-14.24 8.06-6.64-3.8Z" fill="#A5D8FF"></path></g></svg>
                <h2>WorkMeter v1.0</h2>
                <h3>Employee Attendance Monitoring and Payroll System</h3>
                <h5>Track attendance effortlessly, streamline payroll automatically. Employee Attendance Monitoring and Payroll System V.0.1 gives your workplace the power to manage time, performance, and payouts with accuracy and zero hassle.</h5>
                <SignUpBtn onClick={() => nextRouter.push("/signup")} label="SIGN-UP NOW"></SignUpBtn>
            </Box>
        </StyledLoginPage>
    )
}

export default LoginPage;