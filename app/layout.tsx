import type {Metadata} from "next";
import {satoshi} from "./fonts/fonts";
import "./globals.css";

export const metadata: Metadata = {
    title: "ParkQR - Sistema de Gestion de Parqueadero",
    description: "Sistema hibrido de gestion de parqueadero con codigos QR",
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="es" className={satoshi.variable}>
            <body>
                {children}
            </body>
        </html>
    );
}
