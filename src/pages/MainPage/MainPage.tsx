import { useEffect, useState } from "react";

import { AutoSizer, useChangeSubject, sleep } from "react-declarative";

import { makeStyles } from "../../styles/makeStyles";

import Card from "../../components/common/Card";
import Chart from "./Chart";

import Box from "@mui/material/Box";

import netEmitter from "../../lib/source/netEmitter";
import netInputEmitter from "../../lib/source/netInputEmitter";

import useInformer from "../../hooks/useInformer";

import { CC_NET_EMIT_THRESHOLD } from "../../config/params";

const CARD_LABEL = "KUCOIN ticker:ETH-USDT HIGH candle 1M";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    height: "85vmin",
    width: "100%",
  },
}));

export const MainPage = () => {
  const { classes } = useStyles();

  const [predict, setPredict] = useState<
    "train" | "upward" | "downward" | null
  >("train");

  const predictChanged = useChangeSubject(predict);

  useInformer(predict);

  useEffect(() => {
    console.log("Right now this app is collecting data of raise and fail patterns. Please wait for the following logs");
  }, []);

  useEffect(
    () =>
      netEmitter.once((net) => {
        const process = async () => {
          while (true) {
            const netInput = await netInputEmitter.toPromise();
            const [upward = 0, downward = 0] = Object.values(net.run(netInput));
            if (Math.abs(upward - downward) > CC_NET_EMIT_THRESHOLD) {
              const result = upward > downward ? "upward" : "downward";
              setPredict(result);
            } else {
              setPredict(null);
            }
            await sleep(1_000);
          }
        };
        process();
        setPredict(null);
      }),
    []
  );

  return (
    <Box className={classes.root}>
      <Box className={classes.container}>
        <Card label={CARD_LABEL}>
          <AutoSizer>
            {({ height, width }) => (
              <Chart
                predictChanged={predictChanged}
                height={height}
                width={width}
              />
            )}
          </AutoSizer>
        </Card>
      </Box>
    </Box>
  );
};

export default MainPage;
