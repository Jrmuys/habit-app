import { ProfileContext } from "@/lib/profileContext";
import { useContext } from "react";

export function useProfile() {
    const context = useContext(ProfileContext);

    if (context === undefined) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }

    return context;
}
