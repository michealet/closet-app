import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, expect, it, vi } from "vitest";
import { PhotoDropArea, pickDroppedPhoto } from "./photo-drop-area";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const { previewPhoto } = vi.hoisted(() => ({ previewPhoto: vi.fn() }));
vi.mock("@/lib/images/prepare", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/images/prepare")>()),
  previewPhoto,
}));

const jpeg = new File(["a"], "shirt.jpg", { type: "image/jpeg" });
const heic = new File(["a"], "IMG_1.HEIC", { type: "" });
const text = new File(["a"], "notes.txt", { type: "text/plain" });

// jsdom has no DataTransfer constructor and only accepts a real FileList.
class FakeTransfer {
  files: File[] = [];
  items = { add: (file: File) => this.files.push(file) };
}
let assigned: File[] | undefined;
beforeEach(() => {
  vi.clearAllMocks();
  assigned = undefined;
  vi.stubGlobal("DataTransfer", FakeTransfer);
  previewPhoto.mockImplementation(async (file: File) => `blob:${file.name}`);
  URL.revokeObjectURL = vi.fn();
});

function renderArea() {
  const { container } = render(
    <PhotoDropArea label="Photo" required inputRef={null} />,
  );
  const input = screen.getByLabelText("Photo") as HTMLInputElement;
  Object.defineProperty(input, "files", {
    get: () => assigned,
    set: (files: File[]) => (assigned = files),
  });
  return { area: container.querySelector("[class*=border-dashed]")!, input };
}

function drag(area: Element, type: "dragOver" | "drop", files: File[]) {
  const event = createEvent[type](area);
  const preventDefault = vi.spyOn(event, "preventDefault");
  Object.defineProperty(event, "dataTransfer", {
    value: { types: ["Files"], files, dropEffect: "none" },
  });
  fireEvent(area, event);
  return preventDefault;
}

it("accepts one JPEG, PNG, WebP or HEIC photo", () => {
  expect(pickDroppedPhoto([jpeg])).toEqual({ file: jpeg });
  expect(pickDroppedPhoto([heic])).toEqual({ file: heic });
  expect(pickDroppedPhoto([text])).toEqual({
    error: "That file isn't a photo. Try a JPEG, PNG, WebP or HEIC.",
  });
  expect(pickDroppedPhoto([jpeg, jpeg])).toEqual({
    error: "Drop one photo at a time.",
  });
  expect(pickDroppedPhoto([])).toHaveProperty("error");
});

it("highlights while a file is dragged over and selects a dropped photo", () => {
  const { area, input } = renderArea();
  const changed = vi.fn();
  input.addEventListener("change", changed);

  drag(area, "dragOver", [jpeg]);
  expect(area).toHaveAttribute("data-dragging");

  expect(drag(area, "drop", [jpeg])).toHaveBeenCalled();
  expect(area).not.toHaveAttribute("data-dragging");
  expect(assigned).toEqual([jpeg]);
  expect(changed).toHaveBeenCalled();
  expect(screen.getByText("shirt.jpg")).toBeInTheDocument();
});

it("explains a wrong drop and keeps the selected photo", () => {
  const { area, input } = renderArea();
  drag(area, "drop", [jpeg]);

  drag(area, "drop", [text]);
  expect(screen.getByRole("alert")).toHaveTextContent("isn't a photo");
  expect(toast.error).toHaveBeenCalledWith(
    "That file isn't a photo. Try a JPEG, PNG, WebP or HEIC.",
  );
  drag(area, "drop", [jpeg, jpeg]);
  expect(screen.getByRole("alert")).toHaveTextContent("one photo at a time");
  expect(assigned).toEqual([jpeg]);
  expect(input).toHaveAccessibleDescription("Selected: shirt.jpg");
});

it("opens the picker when the area is clicked", () => {
  const { area, input } = renderArea();
  const click = vi.spyOn(input, "click");
  fireEvent.click(area);
  expect(click).toHaveBeenCalledOnce();
});

it("stops the browser opening files dropped next to the area", () => {
  renderArea();
  const event = new Event("drop", { cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { types: ["Files"] } });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});

it("shows the chosen photo straight away", async () => {
  const { area } = renderArea();
  drag(area, "drop", [jpeg]);
  const image = await screen.findByRole("img", {
    name: "Chosen photo: shirt.jpg",
  });
  expect(image).toHaveAttribute("src", "blob:shirt.jpg");
  expect(previewPhoto).toHaveBeenCalledWith(jpeg);
});

it("shows only the latest photo when one is slow to convert", async () => {
  let finishHeic: (url: string) => void = () => {};
  previewPhoto.mockImplementationOnce(
    () => new Promise((resolve) => (finishHeic = resolve)),
  );
  const { area } = renderArea();
  drag(area, "drop", [heic]);
  drag(area, "drop", [jpeg]);
  await screen.findByRole("img", { name: "Chosen photo: shirt.jpg" });

  finishHeic("blob:heic");
  await waitFor(() =>
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:heic"),
  );
  expect(screen.getByRole("img", { name: /Chosen photo/ })).toHaveAttribute(
    "src",
    "blob:shirt.jpg",
  );
});

it("says when a chosen photo can't be shown", async () => {
  previewPhoto.mockRejectedValueOnce(new Error("broken"));
  const { area } = renderArea();
  drag(area, "drop", [heic]);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Couldn't show this photo",
  );
});
