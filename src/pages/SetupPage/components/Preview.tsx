import { AutoSizer } from "react-declarative";

import { NeuralNetwork, utilities } from "brain.js";

import Box from "@mui/material/Box";

import { fromData } from "../utils/serializeConfig";

import IData from "../model/IData.model";

import { CC_INPUT_SIZE, CC_OUTPUT_SIZE } from "../../../config/params";

interface IPreviewProps {
  data: IData;
}

export const Preview = ({ data }: IPreviewProps) => {
  const handleElement = (ref: HTMLDivElement, side: number) => {
    const config = {
        inputSize: CC_INPUT_SIZE,
        hiddenLayers: fromData(data).net.hiddenLayers,
        outputSize: CC_OUTPUT_SIZE,
    };
    ref.innerHTML = utilities.toSVG(new NeuralNetwork(config), {
      fontSize: "12px",
      width : side,
      height : side,
      radius: 6,
      line: {
        className: "net-preview__line",
        width: 0.5,
        color: "rgba(255,255,255,1)",
      },
      hidden: {
        className: "net-preview__hidden",
        color: "rgba(255,127,80,0.6)",
      },
      outputs: {
        className: "net-preview__outputs",
        color: "rgba(100,149,237,0.6)",
      },
      inputs: { className: "net-preview__inputs", color: "rgba(0,127,0,0.6)" },
    });
  };

  return (
    <Box
      sx={{
        overflow: "hidden",
        background: "#0007",
        marginTop: "20px",
        width: "100%",
      }}
    >
      <AutoSizer payload={data}>
        {({ width }) => {
          return (
            <div
              ref={(element) => {
                if (!width) {
                    return;
                }
                if (!element) {
                    return;
                }
                handleElement(element, width);
              }}
            />
          );
        }}
      </AutoSizer>
    </Box>
  );
};

export default Preview;
