'use client'
import dynamic from 'next/dynamic'
const ToolpadAppProvider = dynamic(() => import('./ToolPadAppProvider') ,{ ssr: false });
export default ToolpadAppProvider;