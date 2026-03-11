"use client"
import React from "react";
import { styled } from '@mui/material/styles';
import doApiRequest from "@/app/helpers/doApiRequest";
import ExpirationTimer from "./ExpirationTimer";
import { enqueueSnackbar } from 'notistack';

import { 
    Box,
    Alert,
    TextField,
    Paper,
    Button
} from "@mui/material";

interface IResetPasswordPageConten {
    token: string
}

type TTokenData = {
    account: {
        email: string,
        userName: string,
        uid: string
    },
    expDate: Date,
    iat: number,
    exp: number
}

const StyledResetPasswordPageContent = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 100vh;
        align-items: center;
        justify-content: center;

        > form {
            position: relative;
            display: flex;
            flex: 0 1 500px;
            height: 550px;
            padding: 50px  20px;
            flex-wrap: wrap;
            align-content: flex-start;
            justify-content: center;
            gap: 20px;

            > .timer {
                flex: 0 1 100%;
            }

            > .logo {
                display: flex;
                flex: 0 1 100%;
                justify-content: center;
                align-items: center;
                position: absolute;
                bottom: 40px;

                > h2 {
                    color: #39F;
                }
            }
        }
    }
`

const ResetPasswordPageContent: React.FC<IResetPasswordPageConten> = ({token}) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<null | string>(null);
    const [password, setPassword] = React.useState({new: "", confirm: ""});
    const [passwordError, setPasswordError] = React.useState<null | string>(null);
    const [passwordValid, setPaswordValid] = React.useState(false);
    const [passwordIsMatch, setPasswordIsMatch] = React.useState(false);
    const [sendingData, setSendingData] = React.useState(false);
    const [data, setData] = React.useState<null | TTokenData>(null);
    const [done, setDone] = React.useState(false);

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        await doApiRequest(
            "/api/post/reset-password",
            (data) => {
                enqueueSnackbar("Password changed successfully.", {variant: 'success', anchorOrigin: {vertical: "top", horizontal: "center"}});

                doApiRequest(
                    "/api/post/add-rptoken-invalidator",
                    (data) => setDone(true),
                    (state) => {},
                    (error) => {},
                    {
                        method: "POST",
                        body: JSON.stringify({token})
                    }
                )
            },
            (state) => setSendingData(state),
            (error) => {
                enqueueSnackbar(error.message, {variant: 'error', anchorOrigin: {vertical: "top", horizontal: "center"}});
            },
            {
                method: "POST",
                body: JSON.stringify({email: data?.account.email, password: password.new})
            }
        )
    }

    React.useEffect(() => {
        (passwordValid && password.new == password.confirm)? setPasswordIsMatch(true) : setPasswordIsMatch(false);
    }, [password, passwordValid]);

    React.useEffect(() => {
        (async ()  => {
            await doApiRequest<{invalidatorToken: string | undefined}>(
                "/api/get/get-rptoken-invalidator",
                (data) => {
                    if(data.invalidatorToken && data.invalidatorToken == token) {
                        setError("Eyyy")
                    }
                },
                (state) => {},
                (error) => {}
            )
    
            await doApiRequest<TTokenData>(
                "/api/post/verify-reset-password-token",
                (data) => {
                    setData(data);
                    if(error) setError(null);
                },
                (state) => setLoading(state),
                (error) => {
                    setError(error.message)
                },
                {
                    method: "POST",
                    body: JSON.stringify({token})
                }
            );
        })();
    }, [token]);

    return(
        <StyledResetPasswordPageContent>
            {
                loading? <>
                    <LoadingPage>
                        <h5>Loading please wait...</h5>
                        <div className="loader"></div>
                    </LoadingPage>
                </> : <>
                {
                    error? <Alert severity="error">
                        Oops! This link has expired. Please request a new one.
                    </Alert> :
                    done? <>
                        <Alert severity="success">Done!</Alert>
                    </> : 
                    <>
                        {
                            data? <>
                                <Paper component="form" onSubmit={handleSubmit}>
                                    <h3>Reset Password</h3>
                                    <Alert severity="info">
                                        The password must be at least 8 characters long and have at least 1 numeric character and at least 1 uppercase letter.
                                        </Alert>
                                    <TextField 
                                    sx={{
                                        '& input:-webkit-autofill': {
                                        WebkitBoxShadow: '0 0 0 1000px #a9e8fb60 inset',
                                        WebkitTextFillColor: '#000',
                                        transition: 'background-color 9999s ease-in-out 0s',
                                        },
                                    }}
                                    error={!!passwordError}
                                    value={password.new} onChange={(e) => {
                                        const hasError = (function validatePassword(password: string): null | string {
                                            const regex = /^(?=.*[A-Z])(?=.*\d).*$/;
                                        
                                            if (password.length < 8) {
                                            return "The password must be at least 8 characters long and have at least 1 numeric character and at least 1 uppercase letter.";
                                            }
                                        
                                            if (!regex.test(password)) {
                                            return "The password must be at least 8 characters long and have at least 1 numeric character and at least 1 uppercase letter.";
                                            }
                                        
                                            return null;
                                        })(e.target.value);
                                        setPasswordError(hasError);
                                        setPaswordValid(hasError == null);
                                        setPassword({...password, new: e.target.value})
                                    }} 
                                    label="Enter new password" type="password" fullWidth
                                    />
                                    <TextField 
                                    sx={{
                                        '& input:-webkit-autofill': {
                                        WebkitBoxShadow: '0 0 0 1000px #a9e8fb60 inset',
                                        WebkitTextFillColor: '#000',
                                        transition: 'background-color 9999s ease-in-out 0s',
                                        },
                                    }}
                                    disabled={!passwordValid} error={passwordValid && !passwordIsMatch}
                                    value={password.confirm} onChange={(e) => setPassword({...password, confirm: e.target.value})}  
                                    label="Enter again to verify password" type="password" fullWidth/>
                                    <Button disabled={!(passwordValid && passwordIsMatch)} loading={sendingData} loadingPosition="end" type="submit" variant="contained" fullWidth>Reset</Button>
                                    <div className="timer">
                                        <ExpirationTimer expirationDate={new Date(data?.expDate).getTime()} onExpires={() =>setError("Form Expired")} text='This Form Expires within'/>
                                    </div>
                                    <div className="logo">
                                        <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><g mask="url(#a)"><path d="M22.74 27.73v-7.6l6.64-3.79v7.6l-6.64 3.79Z" fill="#007FFF"></path><path d="M16.1 23.93v-7.59l6.64 3.8v7.59l-6.65-3.8Z" fill="#39F"></path><path d="m16.1 16.34 6.64-3.8 6.64 3.8-6.64 3.8-6.65-3.8Z" fill="#A5D8FF"></path></g><mask id="b" maskUnits="userSpaceOnUse" x="8" y="17" width="14" height="15" style={{maskType: "alpha"}}><path d="M8.5 22.3c0-1.05.56-2 1.46-2.53l3.75-2.14c.89-.5 1.98-.5 2.87 0l3.75 2.14a2.9 2.9 0 0 1 1.46 2.52v4.23c0 1.04-.56 2-1.46 2.52l-3.75 2.14c-.89.5-1.98.5-2.87 0l-3.75-2.14a2.9 2.9 0 0 1-1.46-2.52v-4.23Z" fill="#D7DCE1"></path></mask><g mask="url(#b)"><path d="M15.14 32v-7.6l6.65-3.8v7.6L15.14 32Z" fill="#007FFF"></path><path d="M8.5 28.2v-7.6l6.64 3.8V32L8.5 28.2Z" fill="#39F"></path><path d="m8.5 20.6 6.64-3.79 6.65 3.8-6.65 3.8-6.64-3.8Z" fill="#A5D8FF"></path></g><mask id="c" maskUnits="userSpaceOnUse" x="8" y="4" width="22" height="20" style={{maskType: "alpha"}}><path d="M24.17 4.82a2.9 2.9 0 0 0-2.87 0L9.97 11.22a2.9 2.9 0 0 0-1.47 2.53v4.22c0 1.04.56 2 1.46 2.52l3.75 2.14c.89.5 1.98.5 2.87 0l11.33-6.42a2.9 2.9 0 0 0 1.47-2.52V9.48c0-1.04-.56-2-1.46-2.52l-3.75-2.14Z" fill="#D7DCE1"></path></mask><g mask="url(#c)"><path d="M15.14 23.46v-7.6L29.38 7.8v7.59l-14.24 8.07Z" fill="#007FFF"></path><path d="M8.5 19.66v-7.6l6.64 3.8v7.6l-6.64-3.8Z" fill="#39F"></path><path d="M8.5 12.07 22.74 4l6.64 3.8-14.24 8.06-6.64-3.8Z" fill="#A5D8FF"></path></g></svg>
                                        <h2>WorkMeter</h2>
                                    </div>
                                </Paper>
                            </> : ""
                        }
                    </>
                }
                </>
            }
        </StyledResetPasswordPageContent>
    )
}

const LoadingPage = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 100vh;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        /* background-color: #24044d; */

        > h5 {
            margin-bottom: 50px;
            color: #186fe8;
        }

        > .loader {
            color: #186fe8;
            font-size: 45px;
            text-indent: -9999em;
            overflow: hidden;
            width: 1em;
            height: 1em;
            border-radius: 50%;
            position: relative;
            transform: translateZ(0);
            animation: mltShdSpin 1.7s infinite ease, round 1.7s infinite ease;
        }

        @keyframes mltShdSpin {
            0% {
                box-shadow: 0 -0.83em 0 -0.4em,
                0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em,
                0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
            }
            5%,
            95% {
                box-shadow: 0 -0.83em 0 -0.4em, 
                0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 
                0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
            }
            10%,
            59% {
                box-shadow: 0 -0.83em 0 -0.4em, 
                -0.087em -0.825em 0 -0.42em, -0.173em -0.812em 0 -0.44em, 
                -0.256em -0.789em 0 -0.46em, -0.297em -0.775em 0 -0.477em;
            }
            20% {
                box-shadow: 0 -0.83em 0 -0.4em, -0.338em -0.758em 0 -0.42em,
                -0.555em -0.617em 0 -0.44em, -0.671em -0.488em 0 -0.46em, 
                -0.749em -0.34em 0 -0.477em;
            }
            38% {
                box-shadow: 0 -0.83em 0 -0.4em, -0.377em -0.74em 0 -0.42em,
                -0.645em -0.522em 0 -0.44em, -0.775em -0.297em 0 -0.46em, 
                -0.82em -0.09em 0 -0.477em;
            }
            100% {
                box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 
                0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
            }
        }

        @keyframes round {
            0% { transform: rotate(0deg) }
            100% { transform: rotate(360deg) }
        }
 
    }
  
`

export default ResetPasswordPageContent;