"use client";
import { styled } from '@mui/material/styles';
import React from "react";
import { IStyledFC } from "../types/IStyledFC";
import Sitemap from '../components/Sitemap';

const PageContentFC: React.FC<IStyledFC> = ({className, children}) => {

    return(
        <div className={className}>
            <Sitemap />
            {children}
        </div>
    )
}

const PageContent = styled(PageContentFC)`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
    min-height: calc(100vh - 100px);
    padding: 20px;
    align-content: flex-start;
    transition: 400ms margin-left;
`;

export default PageContent;