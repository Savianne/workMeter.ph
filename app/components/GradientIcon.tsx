import { IStyledFC } from "../types/IStyledFC";

const GradientIcon:React.FC = () => (
   <svg width="0" height="0" style={{position: "fixed", left: -100, top: -100}}>
        <defs>
            <linearGradient id="gradient">
            <stop offset="0%" stopColor="var(--primaryAppColor)" />
            <stop offset="100%" stopColor="var(--secondaryAppColor)" />
            </linearGradient>
        </defs>
    </svg>
);

export default GradientIcon;
