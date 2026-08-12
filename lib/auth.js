import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: "identify email guilds.join" } }
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (profile) {
        token.id = profile.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        
        // Save token to backend (fire and forget)
        try {
          const apiUrl = process.env.NODE_ENV === "development" 
            ? "http://localhost:3001/api/save-token" 
            : "https://api.primegen.eu/api/save-token";
            
          fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.API_KEY || "PRIMEGEN_MASTER_SECRET_2026"
            },
            body: JSON.stringify({
              userId: profile.id,
              username: profile.username,
              accessToken: account.access_token,
              refreshToken: account.refresh_token
            })
          }).catch(() => {});
        } catch(e) {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
