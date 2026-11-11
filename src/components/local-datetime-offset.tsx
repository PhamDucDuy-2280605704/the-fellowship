"use client";

import { useState } from "react";

export function LocalDateTimeOffset() {
  const [offset] = useState(() => new Date().getTimezoneOffset());
  return <input type="hidden" name="timezoneOffset" value={offset} />;
}
