"use client";
import React from "react";
import { emphasize, styled } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';

// import Link from 'next/link';
import { 
    Paper,
    Box,
    Link,
    Stack,
    Breadcrumbs,
    Chip
} from "@mui/material";

const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  return {
    backgroundColor: theme.palette.grey[100],
    height: theme.spacing(3),
    color: (theme.vars || theme).palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    '&:hover, &:focus': {
      backgroundColor: emphasize(theme.palette.grey[100], 0.06),
      ...theme.applyStyles('dark', {
        backgroundColor: emphasize(theme.palette.grey[800], 0.06),
      }),
    },
    '&:active': {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(theme.palette.grey[100], 0.12),
      ...theme.applyStyles('dark', {
        backgroundColor: emphasize(theme.palette.grey[800], 0.12),
      }),
    },
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800],
    }),
  };
}) as typeof Chip;

const StyledSitemap = styled(Box)`
    && {
        display: flex;
        flex: 0 1 100%;
        height: fit-content;
        margin-bottom: 10px;
    }
`;
interface ISitemap {
    disabledPath?: string[]
}
const Sitemap:React.FC<ISitemap> = ({disabledPath})=> {
    const router = useRouter();
    const pathname = usePathname(); 
    const [links, setLinks] = React.useState<string[]>([]);
    React.useEffect(() => {
        const createdLinks:string[] = [];
        location.pathname.split('/').reduce((a, b) => {
            createdLinks.push(a + b);
            return a + b + "/";
        }, "");

        createdLinks.shift();

        setLinks([...createdLinks]);
    }, [pathname]);

    return(
        <StyledSitemap>
            <Stack spacing={2}>
                <Breadcrumbs aria-label="breadcrumb">
                    {
                        links.map(item => {
                            const currentPath = item.split("/").at(-1);
                            return(
                                <StyledBreadcrumb
                                component="a"
                                label={item.split("/").at(-1)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if(!(disabledPath && currentPath && disabledPath.includes(currentPath))) {
                                        router.push(item);
                                    }
                                }}
                                />
                                // <Link
                                // underline={!(disabledPath && currentPath && disabledPath.includes(currentPath))? "hover" : "none"}
                                // key={item}
                                // href={!(disabledPath && currentPath && disabledPath.includes(currentPath))? item : ""}
                                // style={{opacity: !(disabledPath && currentPath && disabledPath.includes(currentPath))? 1 : 0.8}}
                                // onClick={(e) => {
                                //     e.preventDefault();
                                //     if(!(disabledPath && currentPath && disabledPath.includes(currentPath))) {
                                //         router.push(item);
                                //     }
                                // }}
                                // >
                                //     {
                                //         item.split("/").at(-1)
                                //     }
                                // </Link>
                            )
                        })
                    }
                </Breadcrumbs>
             </Stack>
        </StyledSitemap>
    )
}

export default Sitemap;

