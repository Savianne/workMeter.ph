"use client"
import React from "react";
import { styled } from '@mui/material/styles';
import doApiRequest from "@/app/helpers/doApiRequest";
import ExpirationTimer from "@/app/reset-password/[token]/ExpirationTimer";
import { compare } from "bcrypt-ts";
import { enqueueSnackbar } from 'notistack';

import { 
    Box,
    Alert,
    TextField,
    Paper,
    Button
} from "@mui/material";

interface IVerifySignupPageContent {
    token: string
}

type TTokenData = {
    accountDetails: {
        email: string,
        username: string,
        password: string
    },
    expDate: Date,
    iat: number,
    exp: number
}

const StyledVerifySignupPage = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: 100vh;
        align-items: center;
        justify-content: center;

        > .password-input {
            display: flex;
            flex-wrap: wrap;
            flex: 0 1 400px;
            gap: 20px;
            padding: 35px 20px;

            > .timer {
                flex: 0 1 100%;
            }
        }
    }
`;

const VerifySignupPage:React.FC<IVerifySignupPageContent> = ({token}) => {
    const [loading, setLoading] = React.useState(true);
    const [onSubmit, setOnSubmit] = React.useState(false);
    const [error, setError] = React.useState<null | string>(null);
    const [data, setData] = React.useState<null | TTokenData>(null);
    const [done, setDone] = React.useState(false);
    const [verifyPassword, setVerifyPassword] = React.useState("");
    const [isMatch, setIsMatch] = React.useState(false);

    const handleSubmit = async () => {
        doApiRequest<TTokenData>(
            "/api/post/sign-up/add-account",
            (data) => setDone(true),
            (state) => setOnSubmit(state),
            (error) => {
                setError(error.message)
            },
            {
                method: "POST",
                body: JSON.stringify({...data, token})
            }
        )
    }

    React.useEffect(() => {
        doApiRequest<TTokenData>(
            "/api/post/verify-signup-details-token",
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
        )
    }, []);

    React.useEffect(() => {
        if(verifyPassword && data) {
            (async () => {
                const match = await compare(verifyPassword, data.accountDetails.password);
                setIsMatch(match);
            })()
        }
    }, [verifyPassword, data])
    return(
        <StyledVerifySignupPage>
            {
                loading? <>
                    <LoadingPage>
                        <h5>Loading please wait...</h5>
                        <div className="loader"></div>
                    </LoadingPage>
                </> : <>
                {
                    error? <Alert severity="error">
                        {error}
                    </Alert> : 
                    done? <>
                        <Alert severity="success">Done!</Alert>
                    </> : 
                    data? 
                    <Paper className="password-input">
                        <div className="timer">
                            <ExpirationTimer expirationDate={new Date(data?.expDate).getTime()} onExpires={() =>setError("Form Expired")} text='This Form Expires within'/>
                        </div>
                        <TextField 
                        label="Enter the account password to verify"
                        type="password"
                        variant="outlined"
                        sx={{flex: '0 1 100%'}}
                        value={verifyPassword}
                        required
                        fullWidth
                        onChange={(e) => {
                            setVerifyPassword(e.target.value);
                        }}
                        />
                        <Button variant="contained" loading={onSubmit} disabled={!isMatch} onClick={handleSubmit} fullWidth>Verify Signup</Button>
                    </Paper> : ""
                }
                </>
            }
            
        </StyledVerifySignupPage>
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
export default VerifySignupPage;