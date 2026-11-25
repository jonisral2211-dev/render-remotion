import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("swangle"); // required on this machine
Config.setChromiumDisableWebSecurity(false);
