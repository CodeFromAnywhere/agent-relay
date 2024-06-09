import { takeFirst } from "from-anywhere";
import vcard from "vcf";
import { SimpleVCard } from "./SimpleVCard.js";
/**
 *
 */
export const fetchVCard = async (
  url: string,
): Promise<SimpleVCard[] | undefined> => {
  try {
    const response = await fetch(url);
    const vCardData = await response.text();
    const vCard = vcard.parse(vCardData);

    // console.log({ vCardData, vCard, length: vCard.length });

    const result = vCard.map((item, index) => {
      /*
      What a monster!

        data: {
    version: [String: '4.0'],
    n: [String: 'Gump;Forrest;;;'],
    fn: [String: 'Forrest Gump'],
    org: [String: 'Bubba Gump Shrimp Co.'],
    title: [String: 'Shrimp Man'],
    photo: { [String: 'http://www.example.com/dir_photos/my_photo.gif'] mediatype: 'image/gif' },
    tel: [
      { [String: 'tel:+11115551212'] type: [ 'work', 'voice' ], value: 'uri' },
      { [String: 'tel:+14045551212'] type: [ 'home', 'voice' ], value: 'uri' }
    ],
    adr: [
      { [String: ';;100 Waters Edge;Baytown;LA;30314;United States of America']
        type: 'work',
        label: '"100 Waters Edge\\nBaytown, LA 30314\\nUnited States of America"' },
      { [String: ';;42 Plantation St.;Baytown;LA;30314;United States of America']
        type: 'home',
        label: '"42 Plantation St.\\nBaytown, LA 30314\\nUnited States ofAmerica"' }
    ],
    email: [String: 'forrestgump@example.com'],
    rev: [String: '20080424T195243Z']
  }*/

      // console.log({
      //   index,
      //   keys: Object.keys(item.data),
      //   values: Object.values(item.data),
      // });

      const org = takeFirst(takeFirst(item.data.org)?.toJSON?.()[3]);
      const title = takeFirst(takeFirst(item.data.title)?.toJSON?.()[3]);
      const fn = takeFirst(takeFirst(item.data.fn)?.toJSON?.()[3]);

      const orgPart = org ? `(${org}) ` : "";
      const titlePart = title ? `(${title}) ` : "";
      const name = `${fn}${orgPart}${titlePart}`;

      const phoneNumber = item.data.tel
        ? takeFirst(takeFirst(item.data.tel)?.toJSON?.()[3])
        : undefined;

      const email = item.data.email
        ? takeFirst(takeFirst(item.data.email)?.toJSON?.()[3])
        : undefined;

      // console.log({ org, title, fn, name, phoneNumber, email });
      const simpleVCard: SimpleVCard = {
        name,
        phoneNumber: phoneNumber ? phoneNumber.replaceAll(" ", "") : undefined,
        email,
      };
      return simpleVCard;
    });

    return result;
  } catch (error: any) {
    console.error("Failed to fetch vCard:", error.message);
    return;
  }
};
