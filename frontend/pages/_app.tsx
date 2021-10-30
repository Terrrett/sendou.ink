import "normalize.css";
import "./_app.css";

import { AppProps } from "next/app";
import Head from "next/head";
import { SWRConfig } from "swr";
import { Layout } from "../components/layout";
import { globalCss } from "stitches.config";

const globalStyles = globalCss({
  "*": { boxSizing: "border-box" },
  "*::before": { boxSizing: "border-box" },
  "*::after": { boxSizing: "border-box" },
  body: {
    backgroundColor: "$bg",
    color: "$text",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    lineHeight: 1.55,
    "-webkit-font-smoothing": "antialiased",
    "-moz-osx-font-smoothing": "antialiased",
  },
});

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  globalStyles();

  return (
    <>
      <Head>
        <title>Page title</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <SWRConfig
        value={{
          fetcher: (resource, init) =>
            fetch(process.env.NEXT_PUBLIC_BACKEND_URL + resource, init).then(
              (res) => res.json()
            ),
        }}
      >
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SWRConfig>
    </>
  );
}
