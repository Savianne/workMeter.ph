import { usePlacesWidget } from "react-google-autocomplete";
const GOOGLE_MAP_API = process.env.GOOGLE_MAP_API as string;

//MUI Components
import { 
    Paper,
    TextField,
    Divider,
    Button,
    Alert,
    Box,
    InputBase,
    Input,
    Avatar,
    AlertTitle
} from "@mui/material";

const GooglePlaceAutoComplete = () => {
    const { ref, autocompleteRef } = usePlacesWidget({
            apiKey: "AIzaSyCOcRov_9qcsPfKfyhkhcsk75WbTOntg4A",
            onPlaceSelected: (place) => {
            console.log(place);
        }
    });

  return (
    <InputBase
        inputRef={ref}
        className="input"
        sx={{ ml: 1, flex: 1}}
        placeholder="Search Google Maps"
        inputProps={{ 'aria-label': 'search google maps' }}
    />)
}

export default GooglePlaceAutoComplete;