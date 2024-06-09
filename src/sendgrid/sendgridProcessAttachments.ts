import { notEmpty } from "from-anywhere";
import { generateId } from "from-anywhere";
import { tryParseJson } from "from-anywhere";
/**
 * Checks based on the attachment info and returns the paths as given by formidable
 */
export const sendgridProcessAttachments = async (formData: FormData) => {
  //@ts-ignore
  const attachmentInfo = formData.get("attachment-info")?.toString() as
    | string
    | undefined;
  const attachmentInfoObject: null | {
    [key: string]: { filename: string; name: string; type: string };
  } = attachmentInfo ? tryParseJson(attachmentInfo) : null;

  if (!attachmentInfoObject) {
    return;
  }

  // const tempFolder = path.join(projectRoot, "assets", "temporary");
  // if (!fs.existsSync(tempFolder)) {
  //   await fs.mkdir(tempFolder, { recursive: true });
  // }

  // const absolutePaths = (
  //   await Promise.all(
  //     Object.keys(attachmentInfoObject).map(async (key) => {
  //       const info = attachmentInfoObject[key];
  //       //@ts-ignore
  //       const blob = formData.get(key) as Blob | null;
  //       if (!blob) {
  //         return;
  //       }
  //       const filename = `${info.filename || generateId()}`;
  //       const filePath = path.join(tempFolder, filename);
  //       const arrayBuffer = await blob.arrayBuffer();
  //       const buffer = Buffer.from(arrayBuffer);
  //       await fs.writeFile(filePath, buffer, "utf8");
  //       return filePath;
  //     }),
  //   )
  // ).filter(notEmpty);

  //return absolutePaths;
};
