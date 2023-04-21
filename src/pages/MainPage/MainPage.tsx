import { useEffect, useState, useRef } from "react";

import { AutoSizer, sleep, Breadcrumbs } from "react-declarative";

import { NeuralNetwork, NeuralNetworkGPU } from "brain.js";

import { makeStyles } from "../../styles/makeStyles";

import Card from "../../components/common/Card";
import Chart from "./Chart";

import Box from "@mui/material/Box";

import downloadFile from "../../utils/downloadFile";
import getTimeLabel from "../../utils/getTimeLabel";

import netEmitter from "../../lib/source/netEmitter";
import netInputEmitter from "../../lib/source/netInputEmitter";
import { predictEmitter } from "./emitters";

import useInformer from "../../hooks/useInformer";

import history from "../../history";

const CARD_LABEL = "KUCOIN ticker:ETH-USDT HIGH candle 1M";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
    flexDirection: "column",
  },
  container: {
    height: "calc(100vh - 80px)",
    width: "100%",
  },
  adjust: {
    flex: 1,
  },
}));

interface INet extends NeuralNetworkGPU<any, any> {}

const options = [
  {
    action: "history-back",
    label: "Go back to net edit",
  },
  {
    action: "export-net",
    isDisabled: (net: INet | null) => !net,
    label: "Export to JS",
  },
];

const getPrediction = async (net: INet): Promise<[number, number]> => {
  const netInput = await netInputEmitter.toPromise();
  const [upward = 0, downward = 0] = Object.values(net.run(netInput));
  return [upward, downward] as [number, number];
};

export const MainPage = () => {
  const { classes } = useStyles();

  const [net, setNet] = useState<INet | null>();

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useInformer(predictEmitter);

  useEffect(() => {
    console.log("Right now this app is collecting data of raise and fail patterns. Please wait for the following logs");
  }, []);

  useEffect(
    () =>
      netEmitter.once((net) => {
        const process = async () => {
          let [prevUpward, prevDownward] = await getPrediction(net);
          await sleep(10_000);
          while (isMounted.current) {
            const [upward, downward] = await getPrediction(net);
            console.log(`net predict upward=${upward} downward=${downward} time=${getTimeLabel(new Date())}`);
            const result = upward > prevUpward ? "upward" : downward > prevDownward ? "downward" : null;
            predictEmitter.next(result);
            prevUpward = upward;
            prevDownward = downward;
            await sleep(10_000);
          }
        };
        process();
        predictEmitter.next(null);
        setNet(net as unknown as INet);
      }),
    []
  );

  const handleAction = (action: string) => {
    if (action === "export-net") {
      const func = NeuralNetwork.prototype.toFunction;
      const code = func.apply(net).toString();
      downloadFile(code, `hypebot-net-${new Date().toISOString()}.json`);
    }
    if (action === "history-back") {
      history.push("/setup-page");
    }
  };

  return (
    <Box className={classes.root}>
      <Breadcrumbs
        title="HypeNet"
        subtitle="TradePage"
        actions={options}
        payload={net}
        onAction={handleAction}
      />
      <Box className={classes.container}>
        <Card label={CARD_LABEL}>
          <AutoSizer>
            {({ height, width }) => (
              <Chart
                predictEmitter={predictEmitter}
                height={height}
                width={width}
              />
            )}
          </AutoSizer>
        </Card>
      </Box>
      <div className={classes.adjust} />
    </Box>
  );
};

export default MainPage;
