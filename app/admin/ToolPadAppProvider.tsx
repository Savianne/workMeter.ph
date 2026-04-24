"use client"
import * as React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { styled } from '@mui/material/styles';
import { IStyledFC } from '@/app/types/IStyledFC';
import { useSession } from "next-auth/react";
import {
  type Navigation,
   Router
} from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { NextAppProvider } from "@toolpad/core/nextjs"
import ThemeToggle from '../components/ThemeToogle';
import { Account } from '@toolpad/core/Account';
import { useTheme } from '@mui/material/styles'
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from "next/navigation";
import LinearProgress from '@mui/material/LinearProgress';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import GroupsIcon from '@mui/icons-material/Groups';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AirlineSeatIndividualSuiteIcon from '@mui/icons-material/AirlineSeatIndividualSuite';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ViewListIcon from '@mui/icons-material/ViewList';
import PaymentsIcon from '@mui/icons-material/Payments';
import { socket } from '@/app/socket/socket';

const NAVIGATION: Navigation = [
    {
        segment: 'admin/dashboard',
        title: 'Dashboard',
        icon: <DashboardIcon sx={{fill: "url(#gradient)"}} />,
        
    },
    {
        kind: 'divider',
    },
    {
        kind: 'header',
        title: 'Modules',
    },
    {
        segment: 'admin/employees',
        title: 'Employees',
        icon: <GroupsIcon sx={{fill: "url(#gradient)"}} />,
    },
    {
        segment: 'admin/scheduler',
        title: 'Scheduler',
        icon: <DateRangeIcon sx={{fill: "url(#gradient)"}} />,
        
    },
    {
        title: 'Leaves',
        icon: <AirlineSeatIndividualSuiteIcon sx={{fill: "url(#gradient)"}} />,
        children: [
            {
                segment: 'admin/leaves',
                title: "Leaves Table",
                icon: <ViewListIcon sx={{fill: "url(#gradient)"}} />,
            },
            {
                segment: 'admin/leave-types',
                title: "Leave Type",
                icon: <ViewListIcon sx={{fill: "url(#gradient)"}} />,
            }
        ],
    },
    {
        segment: 'admin/attendance',
        title: 'Attendance',
        icon: <ScheduleIcon sx={{fill: "url(#gradient)"}} />,
        
    },
    {
        segment: 'admin/contribution',
        title: "Contributions",
        icon: <PaymentsIcon sx={{fill: "url(#gradient)"}} />,
    },
    {
        title: 'Payroll',
        icon: <ReceiptIcon sx={{fill: "url(#gradient)"}} />,
        children: [
            {
                segment: 'admin/payroll/payroll-cycle',
                title: "Payroll Cycle",
                icon: <PublishedWithChangesIcon sx={{fill: "url(#gradient)"}} />,
            },
            {
                segment: 'admin/payroll/run-payroll-cycle',
                title: "Run Payroll Cycle",
                icon: <AutorenewIcon sx={{fill: "url(#gradient)"}} />,
            }
        ],
    },
    {
        kind: 'divider',
    },
    {
        kind: 'header',
        title: 'Management',
    },
    {
        segment: 'admin/manage-account',
        title: "Manage Account",
        icon: <ManageAccountsIcon sx={{fill: "url(#gradient)"}} />,
    }
];

function useCustomRouter(): Router {
    const [pathname, setPathname] = React.useState("");
    const nextRouter = useRouter();
    const path = usePathname();
    const router = React.useMemo(() => {
        return {
            pathname,
            searchParams: new URLSearchParams(),
            navigate: (path: string | URL) => {
                nextRouter.push(String(path));
            },
        };
    }, [pathname]);

    React.useEffect(() => {
        if(path) {
            setPathname(path)
        }
    }, [path])
    return router;
}

const ToolbarActionsFC: React.FC<IStyledFC> = ({className}) => {
    return(
        <div className={className}>
            <Account />
            <ThemeToggle />
        </div>
    )
}

const ToolbarActions = styled(ToolbarActionsFC)`
    && {
        display: flex;
        align-items: center;
    }
`;

export default function ToolpadAppProviderFC({
    children,
}: {
    children: React.ReactNode
}) {
    const theme = useTheme();
    
    const adminSession = useSession();
    const router = useCustomRouter();

    const session = React.useMemo(() => {
        const adminInfo = adminSession.data?.user;
        if(adminSession && adminInfo) {
            return ({
                user: {
                    name: adminInfo.userName,
                    email: adminInfo.email,
                    image: undefined,
                }
            })
        } else {
            return null
        }
    }, [adminSession]);
    
    const authentication = React.useMemo(() => {
        return {
            signIn: () => {},
            signOut: () => {
                signOut()
            },
        };
    }, [adminSession]);

    React.useEffect(() => {
        if(!socket.connected) socket.connect();
    }, []);

    return (
        <AppRouterCacheProvider>
            <React.Suspense fallback={<LinearProgress />}>
                <NextAppProvider
                branding={{
                    // logo: <Image src={"/wcst-logo.png"} alt="logo" width={50} height={50} style={{width: "100%", height: 'auto'}}/>,
                    title: 'WorkMeter.ph',
                    homeUrl: '/',
                }}
                theme={theme}
                session={session}
                authentication={authentication}
                navigation={NAVIGATION}
                router={router}
                >
                    <DashboardLayout
                    defaultSidebarCollapsed
                    slots={{
                        toolbarActions: ToolbarActions
                    }}
                    >
                        {
                            children
                        }
                    </DashboardLayout>
                </NextAppProvider>
            </React.Suspense>
        </AppRouterCacheProvider>
    );
}

