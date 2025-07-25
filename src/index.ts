import { asyncWorker } from "@asyncWorker/index";
const fileInput = document.getElementById("file") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const startBtn = document.getElementById("start") as HTMLButtonElement;
fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result as string;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
            }
        }
    }
});
startBtn.addEventListener("click", () => {
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Increase red component by 50, cap at 255
            data[i] = Math.min(data[i] + 50, 255);
        }
        ctx.putImageData(imgData, 0, 0);
    }
});