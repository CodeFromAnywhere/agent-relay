export const getIsEeaCountryCode = (phoneNumber: string) => {
  const eeaCountryCodes = [
    "+43", //Austria
    "+32", //Belgium
    "+359", //Bulgaria
    "+385", //Croatia
    "+357", //Cyprus
    "+420", //Czech Republic
    "+45", //Denmark
    "+372", //Estonia
    "+358", //Finland
    "+33", //France
    "+49", //Germany
    "+30", //Greece
    "+36", //Hungary
    "+353", //Ireland
    "+39", //Italy
    "+371", //Latvia
    "+370", //Lithuania
    "+352", //Luxembourg
    "+356", //Malta
    "+31", //Netherlands
    "+48", //Poland
    "+351", //Portugal
    "+40", //Romania
    "+421", //Slovakia
    "+386", //Slovenia
    "+34", //Spain
    "+46", //Sweden
    "+354", //Iceland
    "+423", //Liechtenstein
    "+47", //Norway
  ];

  const match = eeaCountryCodes.find((code) => phoneNumber.startsWith(code));
  // console.log({ match });
  return !!match;
};

export const getIsUsCountryCode = (phoneNumber: string) => {
  return phoneNumber.startsWith("+1");
};

/** General function that should map a phone number to a location as described in ManagedDomain */
export const getPhoneNumberLocation = (phoneNumber: string) => {
  if (getIsUsCountryCode(phoneNumber)) {
    return "us";
  }
  if (getIsEeaCountryCode(phoneNumber)) {
    return "eu";
  }
  return "other";
};
