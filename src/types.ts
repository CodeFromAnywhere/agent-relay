export type AssistantType = {
  instructions: string;
  openapiUrl?: string;
  /** @description Used to authenticate to the OpenAPI to use tools */
  openapiAuthToken?: string;
};
