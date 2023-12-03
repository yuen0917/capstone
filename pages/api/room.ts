import { Room, RoomServiceClient } from "livekit-server-sdk";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handleRoom(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { label } = req.query;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    const livekitHost = wsUrl?.replace("wss://", "https://");
    const roomService = new RoomServiceClient(livekitHost!, apiKey, apiSecret);

    const rooms: Room[] = await roomService.listRooms();
    return res.status(200).json({ rooms: rooms });
  } catch {
    const rooms: Room[] = [];
    return res.status(200).json({ rooms: rooms });
  }
}