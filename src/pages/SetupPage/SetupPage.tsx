import { useState } from "react";

import {
  OneTyped,
  TypedField,
  FieldType,
  Breadcrumbs,
  IBreadcrumbsOption,
} from "react-declarative";

import Preview from "./components/Preview";

import IData from "./model/IData.model";

import downloadFile from "../../utils/downloadFile";
import uploadFile from "../../utils/uploadFile";
import serializeConfig, { fromData } from "./utils/serializeConfig";
import parseConfig, { toData } from "./utils/parseConfig";

import { netManager, trainManager } from "../../lib/schema";

import { initialData } from "./config";

import history from "../../history";

const createNeuronField = (index: number): TypedField => ({
  type: FieldType.Group,
  fields: [
    {
      type: FieldType.Typography,
      columns: "2",
      placeholder: `Number of neurons on layer ${index + 1}`,
    },
    {
      type: FieldType.Slider,
      name: `net.hiddenLayers.${index}`,
      columns: "9",
      minSlider: 0,
      maxSlider: 15,
      stepSlider: 1,
    },
    {
      type: FieldType.Text,
      columns: "1",
      inputType: "number",
      outlined: false,
      compute({ net: { hiddenLayers } }) {
        return hiddenLayers[index].toString();
      },
    },
  ],
});

const fields: TypedField<IData>[] = [
  {
    type: FieldType.Group,
    phoneColumns: "12",
    tabletColumns: "3",
    desktopColumns: "3",
    fields: [
      {
        type: FieldType.Component,
        sx: { mr: 1 },
        element: (data) => <Preview data={data} />,
      },
    ],
  },
  {
    type: FieldType.Group,
    phoneColumns: "12",
    tabletColumns: "9",
    desktopColumns: "9",
    fields: [
      {
        type: FieldType.Line,
        title: "Neural Network",
      },
      {
        type: FieldType.Expansion,
        style: { marginBottom: 16 },
        title: "Layers",
        description: "Number of neurons on each layer",
        fields: [
          createNeuronField(0),
          createNeuronField(1),
          createNeuronField(2),
          createNeuronField(3),
          createNeuronField(4),
          createNeuronField(5),
          createNeuronField(6),
          createNeuronField(7),
        ],
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "net.binaryThresh",
        title: "Binary threshhold",
        description: "Transfer function configuration",
        defaultValue: initialData.net.binaryThresh,
      },
      {
        type: FieldType.Combo,
        name: "net.activation",
        title: "Activation function",
        description: "Transfer function itself",
        isInvalid({ net: { activation } }) {
          if (activation === null) {
            return "Transfer function is required";
          } else {
            return null;
          }
        },
        tr(activation) {
          if (activation === "sigmoid") {
            return "Sigmoid function";
          } else if (activation === "relu") {
            return "Relu function";
          } else if (activation === "leaky-relu") {
            return "Leaky-Relu function";
          } else if (activation === "tanh") {
            return "Tanh function";
          } else {
            return "unknown";
          }
        },
        itemList: ["sigmoid", "relu", "leaky-relu", "tanh"],
        defaultValue: initialData.net.activation,
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "net.leakyReluAlpha",
        title: "Leaky relu alpha",
        description: "Negative slope coefficient",
        defaultValue: initialData.net.leakyReluAlpha,
      },
    ],
  },
  {
    type: FieldType.Group,
    fields: [
      {
        type: FieldType.Line,
        title: "Training",
      },
      {
        type: FieldType.Expansion,
        style: { marginBottom: 16 },
        title: "Logging",
        description: "Enable logging",
        fields: [
          {
            type: FieldType.Switch,
            title: "Enable logging",
            name: "train.log",
            defaultValue: initialData.train.log,
          },
          {
            type: FieldType.Text,
            inputType: "number",
            name: "train.logPeriod",
            title: "Logging period",
            description: "Trainment logging period",
            isDisabled({ train: { log } }) {
              return !log;
            },
            defaultValue: initialData.train.logPeriod,
          },
        ],
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "train.iterations",
        title: "Iterations",
        description: "Number of trainment iterations",
        defaultValue: initialData.train.iterations,
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "train.errorThresh",
        title: "Error threshold",
        description: "Trainment error threshold",
        defaultValue: initialData.train.errorThresh,
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "train.learningRate",
        title: "Learning rate",
        description: "Trainment learning rate",
        defaultValue: initialData.train.learningRate,
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "train.momentum",
        title: "Learning momentum",
        description: "Trainment learning momentum",
        defaultValue: initialData.train.momentum,
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "train.callbackPeriod",
        title: "Callback period",
        description: "Callback period",
        defaultValue: initialData.train.callbackPeriod,
      },
      {
        type: FieldType.Text,
        inputType: "number",
        name: "train.timeout",
        title: "Iteration timeout",
        description: "Iteration fallback timeout",
        defaultValue: initialData.train.timeout,
      },
    ],
  },
];

const actions: IBreadcrumbsOption[] = [
    {
        action: 'import-config',
        label: 'Import config',
    },
];

const getInitialData = () => {
  const net = netManager.getValue();
  const train = trainManager.getValue();
  if (net && train) {
    return toData({ net, train });
  }
  return initialData;
}

export const SetupPage = () => {
  
  const [data, setData] = useState<IData>(getInitialData());
  const [changed, setChanged] = useState(false);

  const handleSubmit = () => {
    const config = fromData(data);
    netManager.setValue(config.net);
    trainManager.setValue(config.train);
    if (changed) {
        downloadFile(serializeConfig(data), `hypebot-${new Date().toISOString()}.json`);
    }
    history.push('/main-page');
  };

  const handleAction = (action: string) => {
    if (action === "import-config") {
        uploadFile().then((json) => {
            const data = parseConfig(json);
            const config = fromData(data);
            netManager.setValue(config.net);
            trainManager.setValue(config.train);
            setChanged(false);
            setData(data);
        });
    }
  };

  const handleChange = (data: IData, initial: boolean) => {
    if (!initial) {
        setChanged(true);
    }
    setData(data);
  };

  return (
    <>
      <Breadcrumbs
        withSave
        title="HypeNet"
        subtitle="SetupPage"
        actions={actions}
        onSave={handleSubmit}
        onAction={handleAction}
        saveDisabled={!data}
      />
      <OneTyped<IData>
        handler={data}
        change={handleChange}
        fields={fields}
      />
    </>
  );
};

export default SetupPage;
