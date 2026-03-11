"use client"
import React from "react";
import { styled } from '@mui/material/styles';
import { usePlacesWidget } from "react-google-autocomplete";
import Image from "next/image";
import { signIn, useSession, signOut } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { maskEmail } from "../helpers/maskEmail";
import doApiRequest from "../helpers/doApiRequest";
import { object, string, date, mixed, array } from 'yup';
import { enqueueSnackbar } from 'notistack';
import GooglePlaceAutoComplete from "../components/GooglePlaceAutoComplete";
import AnimatedButton from "../components/AnimatedButton";
import { useRouter, usePathname } from "next/navigation";
import useConfirmModal from "../components/ConfirmModal/useConfirmModal";
import ConfirmModal from "../components/ConfirmModal/ConfirmModal";


//MUI Components
import { 
    Paper,
    TextField,
    Divider,
    Button,
    Alert,
    Box,
    InputBase,
    Select,
    MenuItem,
    IconButton,
    Avatar,
    AlertTitle
} from "@mui/material";

import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import PlaceIcon from '@mui/icons-material/Place';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';

const StyledContent = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        padding: 50px 20px;
        flex-wrap: wrap;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        align-content: center;
        background-color: #e0e0e0;

        > .text-title {
            display: flex;
            height: fit-content;
            flex: 0 1 100%;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 0 20px 50px 20px;
            

            > h1, > h2 {
                max-width: 800px;
                text-align: center;
                font-size: 34px;
            }

            > h1 {
                margin-bottom: 10px;
                color: #007FFF;
            }

            > h2 {
                font-size: 33px;
                font-weight: 100;
                line-height: 1.3;
            }
        }
        

        > form {
            display: flex;
            flex: 0 1 600px;
            /* height: 550px; */
            padding: 50px;
            gap: 20px;
            flex-wrap: wrap;
            align-content: flex-start;
            border-radius: 50px;
            background: linear-gradient(315deg, #f0f0f0, #cacaca);
            box-shadow: -20px -20px 60px #bebebe,
                        20px 20px 60px #ffffff;

            > h1 {
                flex: 0 1 100%;
                text-align: center;
                margin-bottom: 20px;
            }

            > .input {
                display: flex;
                border-radius: 50px;
                height: 80px;
                flex: 0 1 100%;
                padding: 10px;
                border-radius: 50px;
                align-items: center;
                /* text-align: center; */
                font-size: 20px;
                background: #e0e0e0;
                box-shadow: -20px -20px 60px #bebebe,
                            20px 20px 60px #ffffff;

                > .icon-holder {
                    display: flex;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border-radius: 50px;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(315deg, #cacaca, #f0f0f0);
                    box-shadow: -20px -20px 60px #bebebe,
                                20px 20px 60px #ffffff;
                }

                > .input-base, > .select-base {
                    height: 100%;
                    flex: 1;
                }

                > .select-base {
                    outline: 0;
                    border: 0;
                }
            }

            > .system-info {
                display: flex;
                flex: 0 1 100%;
                height: fit-content;
                flex-wrap: wrap;
                justify-content: center;
                height: fit-content;
                padding: 20px;
                
                > h2 {
                    color: #39F;
                }
            }
        }
    }
`;

const industryTypes = [
  'Agriculture & Farming',
  'Automotive',
  'Banking & Finance',
  'Construction',
  'Education',
  'Energy & Utilities',
  'Entertainment & Media',
  'Food & Beverage',
  'Government & Public Sector',
  'Healthcare & Medical Services',
  'Hospitality & Tourism',
  'Information Technology (IT)',
  'Insurance',
  'Logistics & Transportation',
  'Manufacturing',
  'Marketing & Advertising',
  'Mining & Natural Resources',
  'Non-Profit / NGO',
  'Real Estate',
  'Retail & E-commerce',
  'Telecommunications',
  'Wholesale & Distribution',
];

interface IAddressAutoComplete {
    onPlaceSelected: (value: {
        region: string;
        province: string;
        city: string;
        country: string;
        formatedAddress: string
    }) => void
}

const AddressAutoComplete: React.FC<IAddressAutoComplete> = ({onPlaceSelected}) => {
    const { ref, autocompleteRef } = usePlacesWidget({
        apiKey: "AIzaSyCOcRov_9qcsPfKfyhkhcsk75WbTOntg4A",
        options: {type: ["address"]},
        onPlaceSelected: (place) => {
            let addressObject:any = {};
            
            if(place && place.address_components) {
                place.address_components.forEach((item:any) => {
                    switch(item.types[0]) {
                        case "locality":
                            addressObject.city = item.long_name;
                            break;
                        case "administrative_area_level_1":
                            addressObject.region = item.long_name;
                            break;
                        case "administrative_area_level_2":
                            addressObject.province = item.long_name;
                        case "country":
                            addressObject.country = item.long_name;
                    }
                });
            }

            onPlaceSelected({...addressObject, formatedAddress: (place && place.address_components)? place.formatted_address : ""});
        }
    });
    return(
        <InputBase
        className="input-base"
        inputRef={ref}
        sx={{ ml: 1, flex: 1}}
        placeholder="Company Address"
        inputProps={{ 'aria-label': 'search google maps' }}
        />
    )
}

const CreateOrganizationPage: React.FC = () => {
    const {modal, confirm} = useConfirmModal()
    const nextRouter = useRouter();
     const { update } = useSession();
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            redirect('/login');
        }
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [natureOfBusiness, setNatureOfBusiness] = React.useState("");
    const [companyName, setCompanyName] = React.useState("");
    const [validationError, setValidationError] = React.useState<null | string>(null);
    const [companyAddressInputValue, setCompanyAddressInputValue] = React.useState<string | null>(null);
    const [companyAddress, setCompanyAddress] = React.useState({
        region: "",
        province: "",
        city: "",
        country: ""
    });
    
    const handleContinueAsEmployeeAccount = async () => {
        confirm("Are you sure you want to skip this step and continue creating the account as an Employee?", () => {
            doApiRequest<{success: boolean, companyId: string}>(
                "/api/private/post/employee-signup",
                async (data) => {
                    await update({
                        reason: "UPDATE_ACC_STATUS",
                        accountStatus: "completed"
                    });
    
                    await update({
                        reason: "UPDATE_ACC_TYPE",
                        accountType: "employee"
                    });
    
    
                    nextRouter.push("/employee");
                },
                (state) => setIsLoading(state),
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                {
                    method: "POST"
                }
            )
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await string().min(5, "Company name must be at least 5 characters").max(100).required("Please fill out all required fields.").validate(companyName);
            await string().min(5, "Nature of Business must be at least 5 characters").max(100).required("Please fill out all required fields.").validate(natureOfBusiness);
            await object({
                region: string().required("Please fill out all required fields."),
                province: string().nullable(),
                city: string().required("Please fill out all required fields."),
                country: string().required("Please fill out all required fields.")
            }).validate(companyAddress);

            if(validationError) setValidationError(null);

            doApiRequest<{success: boolean, companyId: string}>(
                "/api/private/post/complete-sign-up",
                async (data) => {
                    await update({
                        reason: "UPDATE_ACC_STATUS",
                        accountStatus: "completed"
                    });

                    await update({
                        reason: "UPDATE_COMPANY",
                        companyId: data.companyId
                    });

                    await update({
                        reason: "UPDATE_ACC_TYPE",
                        accountType: "admin"
                    });

                    nextRouter.push("/admin");
                },
                (state) => setIsLoading(state),
                (error) => {
                    enqueueSnackbar(error.message, {variant: "error", anchorOrigin: {vertical: "top", horizontal: "center"}})
                },
                {
                    method: "POST",
                    body: JSON.stringify({
                        companyName: companyName,
                        natureOfBusiness: natureOfBusiness,
                        address: {
                            ...companyAddress
                        }
                    })
                }
            )
        }
        catch(err:any) {
            setValidationError(err.errors? err.errors : 'Please check your input properly');
        }
    }
    return(
        <StyledContent>
            <ConfirmModal context={modal} severity="warning" />
            {
                session? <>
                <div className="text-title">
                    <h1>Hi {session.user.userName},</h1>
                    <h2>You’re almost there</h2>
                    <h2>Complete the form below to get started with</h2>
                    <h2>WorkMeter</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <h1>Company Information</h1>{
                        validationError? <Alert severity="error" sx={{flex: "0 1 100%"}}>{validationError}</Alert> : ""
                    }
                    <div className="input">
                        <div className="icon-holder">
                            <BusinessIcon sx={{fontSize: '35px', color: '#39F'}} />
                        </div>
                        <InputBase
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="input-base"
                        sx={{ ml: 1, flex: 1}}
                        placeholder="Company or Business Name"
                        inputProps={{ 'aria-label': 'search google maps' }} />
                    </div>
                    <div className="input">
                        <div className="icon-holder">
                            <CorporateFareIcon sx={{fontSize: '35px', color: '#39F'}} />
                        </div>
                        <Select label="Nature of Business" className="select-base" value={natureOfBusiness}
                        onChange={(e) => setNatureOfBusiness(e.target.value)}
                        variant="outlined"
                        displayEmpty
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                            },
                        }}>
                            <MenuItem disabled value="">Nature of Business</MenuItem>
                            {industryTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                    {
                        companyAddressInputValue? 
                        <div className="input">
                            <div className="icon-holder">
                                <PlaceIcon sx={{fontSize: '35px', color: '#39F'}} />
                            </div>
                            <InputBase
                            className="input-base"
                            disabled
                            defaultValue={companyAddressInputValue}
                            sx={{ ml: 1, flex: 1}}
                            placeholder="Company Address"
                            inputProps={{ 'aria-label': 'search google maps' }}
                            />
                            <IconButton aria-label="remove"  size="small" sx={{width: "40px", height: '40px'}}
                            onClick={() => {
                                setCompanyAddressInputValue(null);
                                setCompanyAddress({
                                    region: "",
                                    province: "",
                                    city: "",
                                    country: ""
                                })
                            }}>
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        </div> : 
                        <div className="input">
                            <div className="icon-holder">
                                <PlaceIcon sx={{fontSize: '35px', color: '#39F'}} />
                            </div>
                            <AddressAutoComplete onPlaceSelected={(value) => {
                                setCompanyAddressInputValue(value.formatedAddress);
                                setCompanyAddress({...value});
                            }}   />
                        </div>
                    }
                    
                    <AnimatedButton loading={isLoading} label="Submit the Form to Create Admin Account"/>
                    <h6 style={{textAlign: 'center', flex: " 0 1 100%"}}>OR</h6>
                    <AnimatedButton onClick={handleContinueAsEmployeeAccount} loading={isLoading} label="Skip and Proceed as Employee Account"/>
                    <Button onClick={() => signOut()} fullWidth>Back to login</Button>
                    <Box className="system-info">
                        <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><g mask="url(#a)"><path d="M22.74 27.73v-7.6l6.64-3.79v7.6l-6.64 3.79Z" fill="#007FFF"></path><path d="M16.1 23.93v-7.59l6.64 3.8v7.59l-6.65-3.8Z" fill="#39F"></path><path d="m16.1 16.34 6.64-3.8 6.64 3.8-6.64 3.8-6.65-3.8Z" fill="#A5D8FF"></path></g><mask id="b" maskUnits="userSpaceOnUse" x="8" y="17" width="14" height="15" style={{maskType: "alpha"}}><path d="M8.5 22.3c0-1.05.56-2 1.46-2.53l3.75-2.14c.89-.5 1.98-.5 2.87 0l3.75 2.14a2.9 2.9 0 0 1 1.46 2.52v4.23c0 1.04-.56 2-1.46 2.52l-3.75 2.14c-.89.5-1.98.5-2.87 0l-3.75-2.14a2.9 2.9 0 0 1-1.46-2.52v-4.23Z" fill="#D7DCE1"></path></mask><g mask="url(#b)"><path d="M15.14 32v-7.6l6.65-3.8v7.6L15.14 32Z" fill="#007FFF"></path><path d="M8.5 28.2v-7.6l6.64 3.8V32L8.5 28.2Z" fill="#39F"></path><path d="m8.5 20.6 6.64-3.79 6.65 3.8-6.65 3.8-6.64-3.8Z" fill="#A5D8FF"></path></g><mask id="c" maskUnits="userSpaceOnUse" x="8" y="4" width="22" height="20" style={{maskType: "alpha"}}><path d="M24.17 4.82a2.9 2.9 0 0 0-2.87 0L9.97 11.22a2.9 2.9 0 0 0-1.47 2.53v4.22c0 1.04.56 2 1.46 2.52l3.75 2.14c.89.5 1.98.5 2.87 0l11.33-6.42a2.9 2.9 0 0 0 1.47-2.52V9.48c0-1.04-.56-2-1.46-2.52l-3.75-2.14Z" fill="#D7DCE1"></path></mask><g mask="url(#c)"><path d="M15.14 23.46v-7.6L29.38 7.8v7.59l-14.24 8.07Z" fill="#007FFF"></path><path d="M8.5 19.66v-7.6l6.64 3.8v7.6l-6.64-3.8Z" fill="#39F"></path><path d="M8.5 12.07 22.74 4l6.64 3.8-14.24 8.06-6.64-3.8Z" fill="#A5D8FF"></path></g></svg>
                        <h2>WorkMeter</h2>
                    </Box>
                </form>
                </> : ""
            }
            {/* <Button onClick={() => signOut()}>Sign-Out</Button> */}
        </StyledContent>
    )
}

export default CreateOrganizationPage;