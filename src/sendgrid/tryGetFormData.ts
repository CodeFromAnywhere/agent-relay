export const tryGetFormData = async (request: Request | undefined) => {
  try {
    return request?.formData();
  } catch (e) {
    console.log("COULDNt parse formdata");
    return undefined;
  }
};
