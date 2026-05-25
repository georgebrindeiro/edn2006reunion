import { prisma } from "@/lib/prisma";
import { EVENT } from "@/lib/constants";
import type { EventDetails } from "@/types";

export async function getEventConfig(): Promise<EventDetails> {
  let config = await prisma.eventConfig.findUnique({ where: { id: "singleton" } });

  if (!config) {
    config = await prisma.eventConfig.create({
      data: {
        id: "singleton",
        date: EVENT.date,
        time: EVENT.time,
        venueName: EVENT.venueName,
        venueAddress: EVENT.venueAddress,
        venueCity: EVENT.venueCity,
        mapsUrl: EVENT.mapsUrl,
        costPerPerson: EVENT.costPerPerson,
        costPerPersonReduced: EVENT.costPerPersonReduced,
        costPerChild: EVENT.costPerChild,
        currency: EVENT.currency,
        pixKey: EVENT.pixKey,
        pixRecipientName: EVENT.pixRecipientName,
        pixCity: EVENT.pixCity,
        whatsIncluded: EVENT.whatsIncluded,
      },
    });
  }

  return {
    date:                 config.date,
    time:                 config.time,
    venueName:            config.venueName,
    venueAddress:         config.venueAddress,
    venueCity:            config.venueCity,
    mapsUrl:              config.mapsUrl,
    costPerPerson:        config.costPerPerson,
    costPerPersonReduced: config.costPerPersonReduced,
    costPerChild:         config.costPerChild,
    currency:             config.currency,
    pixKey:               config.pixKey,
    pixRecipientName:     config.pixRecipientName,
    pixCity:              config.pixCity,
    whatsIncluded:        config.whatsIncluded,
  };
}
