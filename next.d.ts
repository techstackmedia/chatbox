// next.d.ts (or any custom file in the types folder)
import { NextApiRequest } from "next";

declare module "next" {
  interface NextApiRequest {
    user?: any; // or more specific type like `DecodedToken`
  }
}
