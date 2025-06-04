import { Request, Response, NextFunction } from 'express';
import "dotenv/config";
import { put } from '@vercel/blob';
import Node from '../../models/Node';
import Edge from '../../models/Edge';
import FlowTextOnly from '../../models/FlowTextOnly';
import FlowTextBox from '../../models/FlowTextBoxD';
import FlowButtonData from '../../models/FlowButtonData';
import FlowCardData from '../../models/FlowCardData';
import Question from '../../models/Question';
import FlowFormSubmission from '../../models/FlowFormSubmission';

export const insertNode = async (req: Request, res: Response) => {
  try {
    await Node.create({
      node_id: req.body.id,
      dragging: req.body.dragging,
      height: req.body.height,
      position: req.body.position,
      position_absolute: req.body.positionAbsolute,
      selected: req.body.selected,
      type: req.body.type,
      width: req.body.width,
      extent: req.body.extent,
      parent_id: req.body.parentId,
      language: req.body.language,
    });

    return res.json({ status: "success" });
  } catch (error) {
    console.error('Error inserting data:', error);
    return res.json({ status: "failed", message: `${error}` });
  }
};
export const insertEdge = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {

        await Edge.create({
            edge_id: req.body.id,
            source: req.body.source,
            source_handle: req.body.sourceHandle,
            target: req.body.target,
            target_handle: req.body.targetHandle,
            type: req.body.type
        });

        res.json({ status: "success"}) 
        } catch (error) {
        console.error('Error inserting data:', error);
    }
};

export const updateNode = async (req: Request, res: Response, next: Function) => {
  try {
    await Node.update(
      { position: req.body.position },
      {
        where: { node_id: req.body.id }, 
      }
    );

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ status: 'failed', message: `${error}` });
  }
};
  
export const updateEdge = async (req: Request, res: Response, next: Function) => {
  try {
    await Edge.update(
      {
        source: req.body.source,
        source_handle: req.body.sourceHandle,
        target: req.body.target,
        target_handle: req.body.targetHandle,
        type: req.body.type
      },
      {
        where: { edge_id: req.body.id }
      }
    );

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error updating edge:', error);
    res.status(500).json({ status: 'failed', message: `${error}` });
  }
};
export const deleteNode = async (req: Request, res: Response, next: Function) => {
  try {
    const { id, type } = req.body;

    // Helper: delete edges and node
    const deleteCommon = async () => {
      await Node.destroy({ where: { node_id: id } });
      await Edge.destroy({ where: { source: id } });
      await Edge.destroy({ where: { target: id } });
    };

    if (["start", "end"].includes(type)) {
      await deleteCommon();
    }

    if (type === "textOnly") {
      await deleteCommon();
      await FlowTextOnly.destroy({ where: { node_id: id } });
    }

    if (type === "textinput") {
      await deleteCommon();
      await FlowTextBox.destroy({ where: { node_id: id } });
    }

    if (type === "button") {
      await deleteCommon();
      await FlowButtonData.destroy({ where: { node_id: id } });
    }

    if (type === "cardGroup") {
      await Node.destroy({ where: { node_id: id } });

      const childs = await Node.findAll({ where: { parent_id: id } });
      for (const child of childs) {
        if (child.type === "cardHeader") {
          await FlowCardData.destroy({ where: { node_id: child.node_id } });
        } else {
          await FlowButtonData.destroy({ where: { node_id: child.node_id } });
        }
      }

      await Node.destroy({ where: { parent_id: id } });
      await Edge.destroy({ where: { source: id } });
      await Edge.destroy({ where: { target: id } });
    }

    if (type === "buttonGroup") {
      await Node.destroy({ where: { node_id: id } });

      const childButtons = await Node.findAll({ where: { parent_id: id } });
      for (const child of childButtons) {
        await FlowButtonData.destroy({ where: { node_id: child.node_id } });
      }

      await Node.destroy({ where: { parent_id: id } });
      await Edge.destroy({ where: { source: id } });
      await Edge.destroy({ where: { target: id } });
    }

    if (type === "cardStyleOne") {
      await Node.destroy({ where: { node_id: id } });
      await Node.destroy({ where: { parent_id: id } });
      await Edge.destroy({ where: { source: id } });
      await Edge.destroy({ where: { target: id } });
      await FlowCardData.destroy({ where: { node_id: id } });
    }

    if (type === "formGroup") {
      await Node.destroy({ where: { parent_id: id } });
      await Node.destroy({ where: { node_id: id } });
      await Edge.destroy({ where: { source: id } });
      await Edge.destroy({ where: { target: id } });
    }

    if (["text", "date", "message"].includes(type)) {
      await Node.destroy({ where: { node_id: id } });
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error("Error deleting node:", error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};

export const deleteEdge = async (req: Request, res: Response, next: Function) => {
  try {
    await Edge.destroy({
      where: { edge_id: req.body.id }
    });

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error deleting edge:', error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};

export const retrieveData = async (req: Request, res: Response, next: Function) => {
  try {
    const nodes = await Node.findAll({
      where: { language: req.body.language }
    });

    const edges = await Edge.findAll();
    const textOnly = await FlowTextOnly.findAll();
    const textBox = await FlowTextBox.findAll();
    const buttonData = await FlowButtonData.findAll();
    const cardData = await FlowCardData.findAll();

    res.json({
      status: "success",
      nodes,
      edges,
      textOnly,
      textBox,
      buttonData,
      cardData
    });
  } catch (error) {
    console.error('Error retrieving data:', error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};

export const textOnlyData = async (req: Request, res: Response, next: Function) => {
  try {
    const { id, text, intent } = req.body;

    // Check if FlowTextOnly record exists
    const data_exist = await FlowTextOnly.findOne({
      where: { node_id: id }
    });

    if (data_exist) {
      // Update existing text
      await FlowTextOnly.update(
        { text },
        { where: { node_id: id } }
      );
    } else {
      // Create new record
      await FlowTextOnly.create({
        node_id: id,
        text
      });
    }

    // Update intent in Node table
    await Node.update(
      { intent },
      { where: { node_id: id } }
    );

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error inserting data:', error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};

export const textBoxData = async (req: Request, res: Response, next: Function) => {
  try {
    const { id, title, description, intent } = req.body;

    // Check if flowTextBox data exists for this node
    const data_exist = await FlowTextBox.findOne({
      where: { node_id: id },
    });

    if (data_exist) {
      // Update existing record
      await FlowTextBox.update(
        { title, description },
        { where: { node_id: id } }
      );
    } else {
      // Create new record
      await FlowTextBox.create({
        node_id: id,
        title,
        description,
      });
    }

    // Update intent in Node
    await Node.update(
      { intent },
      { where: { node_id: id } }
    );

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error inserting data:', error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};

export const ButtonData = async (req: Request, res: Response, next: Function) => {
  try {
    const { id, text, link } = req.body;

    // Check if data already exists
    const data_exist = await FlowButtonData.findOne({
      where: { node_id: id },
    });

    if (data_exist) {
      // Update the existing entry
      await FlowButtonData.update(
        { text, link },
        { where: { node_id: id } }
      );
    } else {
      // Create a new entry
      await FlowButtonData.create({
        node_id: id,
        text,
        link,
      });
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error inserting data:', error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};
export const ButtonGroup = async (req: Request, res: Response, next: Function) => {
  try {
    const { id, intent } = req.body;

    await Node.update(
      { intent },
      { where: { node_id: id } }
    );

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error updating data:', error);
    // res.status(500).json({ status: "failed", error: error.message });
  }
};

export const CardData = async (req: Request, res: Response, next: NextFunction) => {
  console.log("CARD REQ DATA", req.body);

  try {
    let image_path = `${req.protocol}://${req.get('host')}/chat-logo.webp`;

    // Check if data exists
    const data_exist = await FlowCardData.findOne({
      where: { node_id: req.body.id }
    });

    // If image uploaded
    if (req.file) {
      const file = req.file;
      const blob = await put(file.originalname, file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      console.log(blob);
      image_path = blob.url;
    }

    // If card data exists -> update
    if (data_exist) {
      await FlowCardData.update(
        {
          title: req.body.title,
          description: req.body.description,
          ...(req.file && { image: image_path }) // only update image if file exists
        },
        {
          where: { node_id: req.body.id }
        }
      );
    } else {
      // Create new entry
      await FlowCardData.create({
        node_id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        image: image_path
      });
    }

    // Update intent in Node table
    if (req.body.type === "group") {
      await Node.update(
        { intent: req.body.intent },
        { where: { node_id: req.body.parentID } }
      );
    } else {
      await Node.update(
        { intent: req.body.intent },
        { where: { node_id: req.body.id } }
      );
    }

    res.json({ status: "success" });

  } catch (error) {
    console.error('Error inserting data:', error);
    // res.status(500).json({ status: "error", message: error.message });
  }
};

export const getIntentData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let intent_id: number | undefined = parseInt(req.body.intent as string, 10);

    const question_details = await Question.findOne({
      where: { id: intent_id }
    });

    let intent = "";
    if (question_details) {
      const node = await Node.findOne({
        where: { id: question_details.intent }
      });

      if (node) {
        intent = node.intent ?? '';
      }
    }

    let intentData: any[] = [];

    const node_details = await Node.findAll({ where: { intent } });

    console.log("node_details", node_details);

    for (const node of node_details) {
      const { type, node_id } = node;
      let nodeData;

      switch (type) {
        case 'textOnly':
          nodeData = await FlowTextOnly.findOne({ where: { node_id } });
          break;

        case 'textinput':
          nodeData = await FlowTextBox.findOne({ where: { node_id } });
          break;

        case 'cardStyleOne':
          nodeData = await FlowCardData.findOne({ where: { node_id } });
          break;

        case 'buttonGroup': {
          const buttons = await Node.findAll({ where: { parent_id: node_id } });

          const buttonData = await Promise.all(buttons.map(async (button) => ({
            button: await FlowButtonData.findOne({ where: { node_id: button.node_id } })
          })));

          nodeData = buttonData;
          break;
        }

        case 'cardGroup': {
          const childs = await Node.findAll({ where: { parent_id: node_id } });

          const childData = await Promise.all(childs.map(async (child) => {
            if (child.type === 'cardHeader') {
              return { card: await FlowCardData.findOne({ where: { node_id: child.node_id } }) };
            } else {
              return { button: await FlowButtonData.findOne({ where: { node_id: child.node_id } }) };
            }
          }));

          nodeData = childData;
          break;
        }

        case 'formGroup': {
          const fields = await Node.findAll({ where: { parent_id: node_id } });

          const fieldData = await Promise.all(fields.map(async (f) => ({
            field: await Node.findOne({ where: { node_id: f.node_id } })
          })));

          nodeData = fieldData;
          break;
        }

        default:
          continue;
      }

      if (nodeData) {
        intentData.push({ type, node_id, node_data: nodeData });
      }
    }

    res.json({ status: "success", intentData });

  } catch (error) {
    console.error('Error retrieving intent data:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// export const getIntentData = async (req: Request, res: Response, next: Function) => {
//     // console.log("getProducts",req.body);
//      try {
//          let intentData: intentData[] = [];
//          let type: any;
//          let nodeData: any;
 
//          const node_details = await Node.findAll({
//              where: {
//                "intent" : req.body.intent,
//              },
//          });
//          for (var c = 0; c < node_details.length; c++){
             
//              type = node_details[c].type;
//              if(type == 'textOnly'){
//                  const node_data = await FlowTextOnly.findOne({
//                      where: {
//                          "node_id" : node_details[c].node_id,
//                      },
//                      });
//                  nodeData = node_data;
 
//                  intentData.push({type: type, node_data: nodeData});
//              }
//              if(type == 'textinput'){
//                  const node_data = await FlowTextBox.findOne({
//                      where: {
//                          "node_id" : node_details[c].node_id,
//                      },
//                      });
//                  nodeData = node_data;
 
//                  intentData.push({type: type, node_data: nodeData});
//              }
//              if(type == 'cardStyleOne'){
//                  const node_data = await FlowCardData.findOne({
//                      where: {
//                          "node_id" : node_details[c].node_id,
//                      },
//                      });
//                  nodeData = node_data;
//                  intentData.push({type: type, node_data: nodeData});
//              }
//              if (type == 'buttonGroup') {
//                  const buttons = await Node.findAll({
//                      where: {
//                          "parentId": node_details[c].node_id,
//                      },
//                  });
             
//                  let buttonData: any[] = [];
             
//                  for (var x = 0; x < buttons.length; x++) {
//                      const node_data = await FlowButtonData.findOne({
//                          where: {
//                              "node_id": buttons[x].node_id,
//                          },
//                      });
//                      if (node_data) { 
//                          buttonData.push({ button: node_data }); 
//                      }
//                  }
//                  intentData.push({ type: type, node_data: buttonData });
//              }
 
//              if (type == 'cardGroup') {
//                  const childs = await Node.findAll({
//                      where: {
//                          "parentId": node_details[c].node_id,
//                      },
//                  });
             
//                  let buttonData: any[] = [];
             
//                  for (var x = 0; x < childs.length; x++) {
//                      if(childs[x].type == 'cardHeader'){
//                          const node_data = await FlowCardData.findOne({
//                              where: {
//                                  "node_id" : childs[x].node_id,
//                              },
//                          });
//                          if (node_data) { 
//                              buttonData.push({ card: node_data }); 
//                          }
//                      }
//                      else{
//                          const node_data = await FlowButtonData.findOne({
//                              where: {
//                                  "node_id": childs[x].node_id,
//                              },
//                          });
//                          if (node_data) { 
//                              buttonData.push({ button: node_data }); 
//                          }
//                      }
//                  }
 
//                  intentData.push({ type: type, node_data: buttonData });
//              }
             
//          }
//          console.log("intentData",intentData);
//          res.json({ status: "success", intentData:intentData}) 
 
         
         
//      } catch (error) {
//      console.error('Error inserting data:', error);
//      }
//  };

export const getTargetData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let sourceData: any[] = [];

    const targets = await Edge.findAll({
      where: { source: req.body.source }
    });

    for (const singleTarget of targets) {
      const { target } = singleTarget;

      const target_node = await Node.findOne({
        where: { node_id: target }
      });

      const type = target_node?.type;
      let data;

      switch (type) {
        case 'textOnly':
          data = await FlowTextOnly.findOne({ where: { node_id: target_node?.node_id } });
          break;

        case 'textinput':
          data = await FlowTextBox.findOne({ where: { node_id: target_node?.node_id } });
          break;

        case 'cardStyleOne':
          data = await FlowCardData.findOne({ where: { node_id: target_node?.node_id } });
          break;

        case 'buttonGroup': {
          const buttons = await Node.findAll({ where: { parent_id: target_node?.node_id } });

          const buttonData = await Promise.all(buttons.map(async (button) => ({
            button: await FlowButtonData.findOne({ where: { node_id: button.node_id } })
          })));

          data = buttonData;
          break;
        }

        case 'cardGroup': {
          const childs = await Node.findAll({ where: { parent_id: target_node?.node_id } });

          const childData = await Promise.all(childs.map(async (child) => {
            if (child.type === 'cardHeader') {
              return { card: await FlowCardData.findOne({ where: { node_id: child.node_id } }) };
            } else {
              return { button: await FlowButtonData.findOne({ where: { node_id: child.node_id } }) };
            }
          }));

          data = childData;
          break;
        }

        default:
          continue;
      }

      if (data) {
        sourceData.push({ type, source_data: data });
      }
    }

    res.json({ status: "success", sourceData });

  } catch (error) {
    console.error('Error retrieving intent data:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
// export const formData = async (req: Request, res: Response, next: Function) => {
//     //console.log("insertEdge",req.body);
//     try {
//         await prisma.node.updateMany({
//             where: { node_id: req.body.id},
//             data: {  intent: req.body.intent},
//         });
//         console.log("FORM DATA",req.body)
//         console.log("FORM DATA Inputs",req.body.inputs)
//         await Promise.all(req.body.inputs.map(async (input) => {
//             const data_exist = await prisma.node.findFirst({
//                 where: {  node_id: input.id},
//               });

//             if (data_exist) {

//                 await prisma.node.updateMany({
//                     where: { node_id: input.id},
//                     data: {  value: input.value,placeholder: input.placeholder,label: input.label},
//                   });
//             }
//             else{
//                 await prisma.node.create({
//                     data: {
//                         node_id: input.id,
//                         value: input.value,
//                         placeholder: input.placeholder,
//                         label: input.label,
//                         type: input.type,
//                         language: input.language,
//                         parent_id: req.body.id,
//                         position: input.position
//                     },
//                   });
//             }

//         }));
        
//         res.json({ status: "success"}) 
//     } catch (error) {
//     console.error('Error inserting data:', error);
//     }
// };
interface Input {
    id: string;
    value: string;
    placeholder: string;
    label: string;
    type: string;
    language: string;
    position: number;
}
export const formData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Update intent of the node
    await Node.update(
      { intent: req.body.intent },
      { where: { node_id: req.body.id } }
    );

    console.log("FORM DATA", req.body);
    console.log("FORM DATA Inputs", req.body.inputs);

    await Promise.all(req.body.inputs.map(async (input: Input) => {
      const data_exist = await Node.findOne({
        where: { node_id: input.id }
      });

      if (data_exist) {
        await Node.update(
          {
            value: input.value,
            placeholder: input.placeholder,
            label: input.label
          },
          { where: { node_id: input.id } }
        );
      } else {
        await Node.create({
          node_id: input.id,
          value: input.value,
          placeholder: input.placeholder,
          label: input.label,
          type: input.type,
          language: input.language,
          parent_id: req.body.id,
          position: input.position
        });
      }
    }));

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveFormSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valuesString = req.body.inputs
      .map((input: { label: string; value: string }) => `${input.label} - ${input.value}`)
      .join(',');

    await FlowFormSubmission.create({
      form_id: req.body.id,
      field_data: valuesString,
    });

    res.json({ status: "success" });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};