"use client"
import React from "react"
import { styled } from '@mui/material/styles';
import { IStyledFC } from "../types/IStyledFC";
import ReactCrop, { type Crop, makeAspectCrop, centerCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'
import {useDropzone} from 'react-dropzone'
import axios, { AxiosResponse } from 'axios';
import CircularProgressWithLabel from "./CircularProgress";
import playErrorSound from "@/app/components/helpers/playErrorSound";
import playNotifSound from "@/app/components/helpers/playNotifSound";

//MUI Components
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { 
    Avatar,
    Box,
    Button,
    Snackbar,
    Alert
} from "@mui/material";
//MUI Icons
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const DropZone = styled(Box)<{active?: string}>`
    && {
        display: flex;
        width: 400px;
        height: fit-content;
        background-color: ${({theme}) => theme.palette.mode == "dark"? "#1e1e1e" : "#eeeded"};
        border-radius: 10px;
        justify-content: center;
        align-content: center;
        flex-wrap: wrap;
        align-items: center;
        color: ${(p) => p.active == "true"? "rgb(77 167 255)" : "inherit"};
    
        > .icon {
            display: flex;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            transition: color 300ms;
        }
    
        > .info-text {
            width: 100%;
            text-align: center;
            padding: 10px 15px;
            font-weight: 600;
            line-height: 1.1em;
    
            > strong {
                font-size: 25px;
            }
    
            > p {
                font-size: 12px;
            }
        }
    }
`

interface IAvatarPickerFC extends IStyledFC {
    onUploadSuccess: (imageName: string) => void,
    onClose: () => void,
    isOpen: boolean;
    uid: string;
}

export type TResponseFlag<TD> = {
    success: boolean,
    error?: any,
    data?: TD
}

const uploadAvatar = (formData: FormData, onProgress: (progress: number) => void, abortController: AbortController) : Promise<TResponseFlag<{fileName: string}>> => {

    return new Promise<TResponseFlag<{fileName: string}>>(async (res, rej) => {
        try {
            const response: AxiosResponse = await axios.post(`/api/private/update/update-employee-picture`, formData, {
                signal: abortController.signal,
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total && Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    progress && onProgress(progress);
                },
            });

            if(response.data.data.success) {
                res({success: true, data: {fileName: String(response.data.data.fileInfo.name)}})
            } else {
                throw new Error();
            }
          } catch (error) {
            rej({success: false, error: "Faild to Upload image!"})
          }
    })
}

const AvatarPicker: React.FC<IAvatarPickerFC> = ({className, onUploadSuccess, onClose, isOpen, uid}) => {
    const [crop, setCrop] = React.useState<Crop>();
    const [fileForCropping, setFileForCropping] = React.useState<null | File>(null);
    const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
    const imageForCropElem = React.useRef<null | HTMLImageElement>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [uploadError, setUploadError] = React.useState(false);
    const [uploadSuccess, setUploadSuccess] = React.useState(false);
    const [disabledUpload, setDisabledUpload] = React.useState(false);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            // Handle dropped files here
            const image = acceptedFiles[0];
            setFileForCropping(image);
        },
        multiple: false, // Allow only one file to be selected at a time
        accept:  {
            'image/*': [],
        } // Accept only image files
    });

    const handleClose = () => {
        setFileForCropping(null)
        onClose();
    };

    const abortController = new AbortController();

    const handleUpload = async () => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('picture', selectedImageFile as File);
        formData.append('uid', uid);

        try {
            const response = await uploadAvatar(formData, (progress) => setUploadProgress(progress), abortController);
            const imageName = response.data?.fileName;
            if(imageName) {
                playNotifSound();
                if(uploadError) setUploadError(false);
                setUploadSuccess(true);
                setDisabledUpload(true);
                onUploadSuccess(imageName);
            }
        }
        catch(err) {
            playErrorSound()
            if(uploadSuccess) setUploadSuccess(false);
            setUploadError(true);
        }
        finally{
            setIsUploading(false);
            setUploadProgress(0);
        }

    }

    const getCroppedImg = (image: HTMLImageElement, crop: Crop, fileName: string) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const minScale = Math.min(image.naturalHeight, image.naturalWidth) / Math.min(image.width, image.height);

        canvas.width = crop.width * minScale;
        canvas.height = crop.height * minScale;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("No 2d context");
        }

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * minScale,
            crop.height * minScale,
            0,
            0,
            crop.width * minScale,
            crop.height * minScale
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.error('Canvas is empty');
                        return;
                    }

                    resolve(blob)
                },
                'image/jpeg'
            );
        });
    };

    React.useEffect(() => {
        if (fileForCropping) {
            // Create a FileReader
            const reader = new FileReader();

            reader.onload = function (e) {
                const dataURL = e.target?.result;

                // Set the data URL as the src attribute of the image element
                imageForCropElem.current?.setAttribute('src', dataURL as string);
            }
            // Read the content of the file as a data URL
            reader.readAsDataURL(fileForCropping);
        }
    }, [fileForCropping])

    return(
        <div className={className}>
            <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={isOpen}
            >
                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                Upload Display Picture
                </DialogTitle>
                <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent dividers>
                    {
                        selectedImageFile? <>
                            <Avatar src={(() => URL.createObjectURL(selectedImageFile))()} sx={{width: 350, height: 350}}/>
                        </> : <>  
                        {
                        fileForCropping? <DropZone>
                            <ReactCrop 
                            crop={crop} 
                            circularCrop 
                            keepSelection
                            onChange={(c, p) => setCrop(c)} 
                            aspect={1} 
                            className='image-crop'>
                                <img ref={imageForCropElem}
                                onLoad={(e) => {
                                    const width = e.currentTarget.width;
                                    const height = e.currentTarget.height;
                                    const minSize = Math.min(width, height)
                                    const crop = centerCrop(
                                        makeAspectCrop(
                                            {
                                            unit: 'px',
                                            width: minSize,
                                            },
                                            1,
                                            width,
                                            height
                                        ),
                                        width,
                                        height
                                        )
                                        setCrop(crop)
                                    }} 
                                />
                            </ReactCrop>
                        </DropZone> : <DropZone {...getRootProps({active: String(isDragActive)})} style={{height: '300px'}}>
                            <input {...getInputProps()} />
                            <span className="icon">
                                <AddPhotoAlternateIcon sx={{fontSize: "50px"}} />
                            </span>
                            <span className='info-text'>
                                <strong>Add photo</strong>
                                <p>or drag and drop</p>
                            </span>
                        </DropZone>
                        }
                        </>
                    }
                    
                </DialogContent>
                {
                    fileForCropping? 
                    <DialogActions>
                        <Button autoFocus 
                        onClick={async () => {
                            if (imageForCropElem.current && crop) {
                                const croppedImage = await getCroppedImg(
                                    imageForCropElem.current,
                                    crop,
                                    'newFile.jpeg'
                                ) as Blob;
                                
                                // Create a File object from the Blob
                                const file = new File([croppedImage], 'image.png', { type: 'image/png' });

                                setSelectedImageFile(file);
                                setFileForCropping(null);
                            }
                        }}>Crop</Button>
                    </DialogActions> : ""
                }
                {
                    selectedImageFile? 
                    <DialogActions>
                        {
                            isUploading? <>
                                <CircularProgressWithLabel value={uploadProgress} />
                                <Button autoFocus 
                                onClick={async () => {
                                    setIsUploading(false);
                                    setUploadProgress(0);
                                    abortController.abort();
                                }}>Cancel</Button>
                            </> : <>
                                <Button autoFocus 
                                onClick={async () => {
                                    setCrop(undefined);
                                    setFileForCropping(null);
                                    setSelectedImageFile(null);
                                    setDisabledUpload(false);
                                }}>Reset</Button>
                                <Button autoFocus 
                                disabled={disabledUpload}
                                variant="contained"
                                onClick={handleUpload}>Upload</Button>
                            </>
                        }
                    </DialogActions> : ""
                }
                
            </BootstrapDialog>
            <Snackbar open={uploadSuccess} autoHideDuration={6000} onClose={() => setUploadSuccess(false)}>
                <Alert
                onClose={() => setUploadSuccess(false)}
                severity="success"
                variant="standard"
                sx={{ width: '100%' }}
                >
                Upload Success!
                </Alert>
            </Snackbar>
            <Snackbar open={uploadError} autoHideDuration={6000} onClose={() => setUploadError(false)}>
                <Alert
                onClose={() => setUploadError(false)}
                severity="error"
                variant="standard"
                sx={{ width: '100%' }}
                >
                Upload Failed!
                </Alert>
            </Snackbar>
        </div>
    )
};


export default AvatarPicker;