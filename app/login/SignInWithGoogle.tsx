"use client"
import React from "react";
import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from "jwt-decode";
import doApiRequest from "../helpers/doApiRequest";
import { enqueueSnackbar } from "notistack";

const SignInWithGoogleBtn:React.FC = () => {
    return(
    <GoogleLogin
        onSuccess={async credentialResponse => {
            const idToken = credentialResponse.credential;

            const userData = jwtDecode(idToken!);

           await doApiRequest<{logedin: boolean}>(
                "/api/google-signin",
                (data) => {
                    if(data.logedin) {
                        enqueueSnackbar("Log-in success, please wait....", {variant: "success", anchorOrigin: {vertical: "top", horizontal: "center"}});
                        window.location.reload();
                    }
                },
                (state) => {},
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}});
                },
                {
                    method: "POST",
                    body: JSON.stringify(userData)
                }
           )
            
        }}
        onError={() => {
            console.log('Login Failed');
        }}
    />
    )
}

export default SignInWithGoogleBtn;