"use client";
import React from "react";
import { styled } from '@mui/material/styles';
import { useSession } from "next-auth/react";
import { redirect } from 'next/navigation';

//MUI Components
import { 
    Box,
} from "@mui/material";

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

export default function RouteUser() {
    // const { data: session } = useSession({
    //     required: true,
    //     onUnauthenticated() {
    //          redirect('/login');
    //     }
    // });

    React.useEffect(() => {
        setTimeout(() => {
            redirect("/admin");
        }, 2000);
        // if(session && session.user.accountStatus == "completed") {
        //     setTimeout(() => {
        //         redirect("/admin/dashboard");
        //     }, 2000);
        // } else if(session && session.user.accountStatus == "pending") {
        //     setTimeout(() => {
        //         redirect("/create-organization");
        //     }, 2000);
        // }
    })

    return(
        <LoadingPage>
            <h5>Loading please wait...</h5>
            <div className="loader"></div>
        </LoadingPage>
    )
}