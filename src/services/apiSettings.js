import { graphqlRequest } from "./graphqlClient";

export async function getSettings() {
  const data = await graphqlRequest(`
    query GetSettings {
      getSettings {
        id
        minBookingLength
        maxBookingLength
        maxGuestsPerBooking
        breakfastPrice
        updatedAt
      }
    }
  `);

  return data.getSettings;
}

// We expect a newSetting object that looks like {setting: newValue}
export async function updateSetting(newSetting) {
  const current = await getSettings();
  const settingsInput = {
    minBookingLength: Number(
      newSetting.minBookingLength ?? current.minBookingLength
    ),
    maxBookingLength: Number(
      newSetting.maxBookingLength ?? current.maxBookingLength
    ),
    maxGuestsPerBooking: Number(
      newSetting.maxGuestsPerBooking ?? current.maxGuestsPerBooking
    ),
    breakfastPrice: Number(newSetting.breakfastPrice ?? current.breakfastPrice),
  };

  const data = await graphqlRequest(
    `
      mutation UpdateSettings($settingsInput: SettingsDto!) {
        updateSettings(settingsInput: $settingsInput) {
          id
          minBookingLength
          maxBookingLength
          maxGuestsPerBooking
          breakfastPrice
          updatedAt
        }
      }
    `,
    { settingsInput }
  );

  return data.updateSettings;
}
