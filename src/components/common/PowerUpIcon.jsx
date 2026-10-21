import { Icon } from "lucide-react";
import { POWER_UPS_BY_ID } from "@/game/powerUps";

/**
 * A power-up's Lucide icon. The icon data lives in `@/game/powerUps` (shared with the
 * canvas renderer), so this renders it through lucide-react's generic <Icon>. Accepts the
 * usual Lucide props (size, strokeWidth, className...).
 */
const PowerUpIcon = ({ id, ...props }) => <Icon iconNode={POWER_UPS_BY_ID[id].icon} {...props} />;

export default PowerUpIcon;
