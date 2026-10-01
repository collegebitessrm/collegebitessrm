/*
 * The app's icon set: Phosphor (https://phosphoricons.com), DUOTONE by
 * default — an outline plus a soft fill layer, like the two-tone icons on
 * the brand sheet. Import icons from here, never from the library directly.
 *
 * - The names are the app's own vocabulary (kept from when it used lucide,
 *   so call sites read the same); each maps to a Phosphor icon below.
 * - Every icon is Phosphor's SSR build, imported one file per icon, so it
 *   works in server and client components alike and only the icons used
 *   end up in the bundle (the library's barrel file isn't tree-shaken by
 *   Next's optimizePackageImports).
 * - Defaults: 24px (callers size with size-* classes), duotone (bold for
 *   plain glyphs like Plus, X, arrows), and aria-hidden unless given an
 *   aria-label / alt. Pass weight="fill" / "bold" / "regular" to
 *   override.
 * - Styling the fill layer (globals.css): icon-solid makes it opaque (a
 *   filled star), icon-tint-<colour> paints it a palette colour (a gold
 *   star, a pink heart, a cyan cart).
 * - Spinner: Loader2 with animate-spin (Phosphor's CircleNotch — its faint
 *   ring is the track).
 */
import type { ComponentType } from "react";
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react/dist/lib/types";
import { ArrowClockwise as PhArrowClockwise } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { ArrowCounterClockwise as PhArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { ArrowLeft as PhArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowRight as PhArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowsDownUp as PhArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp";
import { Bell as PhBell } from "@phosphor-icons/react/dist/ssr/Bell";
import { BellRinging as PhBellRinging } from "@phosphor-icons/react/dist/ssr/BellRinging";
import { BellSlash as PhBellSlash } from "@phosphor-icons/react/dist/ssr/BellSlash";
import { Bird as PhBird } from "@phosphor-icons/react/dist/ssr/Bird";
import { BowlFood as PhBowlFood } from "@phosphor-icons/react/dist/ssr/BowlFood";
import { BowlSteam as PhBowlSteam } from "@phosphor-icons/react/dist/ssr/BowlSteam";
import { CalendarHeart as PhCalendarHeart } from "@phosphor-icons/react/dist/ssr/CalendarHeart";
import { CaretDown as PhCaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRight as PhCaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Carrot as PhCarrot } from "@phosphor-icons/react/dist/ssr/Carrot";
import { ChatCenteredText as PhChatCenteredText } from "@phosphor-icons/react/dist/ssr/ChatCenteredText";
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check";
import { CheckCircle as PhCheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ChefHat as PhChefHat } from "@phosphor-icons/react/dist/ssr/ChefHat";
import { CircleNotch as PhCircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { ClockCounterClockwise as PhClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { Coffee as PhCoffee } from "@phosphor-icons/react/dist/ssr/Coffee";
import { Compass as PhCompass } from "@phosphor-icons/react/dist/ssr/Compass";
import { Cookie as PhCookie } from "@phosphor-icons/react/dist/ssr/Cookie";
import { CookingPot as PhCookingPot } from "@phosphor-icons/react/dist/ssr/CookingPot";
import { Copy as PhCopy } from "@phosphor-icons/react/dist/ssr/Copy";
import { Crown as PhCrown } from "@phosphor-icons/react/dist/ssr/Crown";
import { DownloadSimple as PhDownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { Egg as PhEgg } from "@phosphor-icons/react/dist/ssr/Egg";
import { EnvelopeSimple as PhEnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { Fire as PhFire } from "@phosphor-icons/react/dist/ssr/Fire";
import { ForkKnife as PhForkKnife } from "@phosphor-icons/react/dist/ssr/ForkKnife";
import { Gift as PhGift } from "@phosphor-icons/react/dist/ssr/Gift";
import { Grains as PhGrains } from "@phosphor-icons/react/dist/ssr/Grains";
import { Hamburger as PhHamburger } from "@phosphor-icons/react/dist/ssr/Hamburger";
import { Heart as PhHeart } from "@phosphor-icons/react/dist/ssr/Heart";
import { IceCream as PhIceCream } from "@phosphor-icons/react/dist/ssr/IceCream";
import { Leaf as PhLeaf } from "@phosphor-icons/react/dist/ssr/Leaf";
import { LockSimple as PhLockSimple } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { MagnifyingGlass as PhMagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { MapPin as PhMapPin } from "@phosphor-icons/react/dist/ssr/MapPin";
import { Medal as PhMedal } from "@phosphor-icons/react/dist/ssr/Medal";
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus";
import { Money as PhMoney } from "@phosphor-icons/react/dist/ssr/Money";
import { Monitor as PhMonitor } from "@phosphor-icons/react/dist/ssr/Monitor";
import { Moon as PhMoon } from "@phosphor-icons/react/dist/ssr/Moon";
import { MoonStars as PhMoonStars } from "@phosphor-icons/react/dist/ssr/MoonStars";
import { Moped as PhMoped } from "@phosphor-icons/react/dist/ssr/Moped";
import { Orange as PhOrange } from "@phosphor-icons/react/dist/ssr/Orange";
import { OrangeSlice as PhOrangeSlice } from "@phosphor-icons/react/dist/ssr/OrangeSlice";
import { Palette as PhPalette } from "@phosphor-icons/react/dist/ssr/Palette";
import { PencilSimple as PhPencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { Pepper as PhPepper } from "@phosphor-icons/react/dist/ssr/Pepper";
import { Phone as PhPhone } from "@phosphor-icons/react/dist/ssr/Phone";
import { PintGlass as PhPintGlass } from "@phosphor-icons/react/dist/ssr/PintGlass";
import { Pizza as PhPizza } from "@phosphor-icons/react/dist/ssr/Pizza";
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Popcorn as PhPopcorn } from "@phosphor-icons/react/dist/ssr/Popcorn";
import { Power as PhPower } from "@phosphor-icons/react/dist/ssr/Power";
import { Prohibit as PhProhibit } from "@phosphor-icons/react/dist/ssr/Prohibit";
import { QrCode as PhQrCode } from "@phosphor-icons/react/dist/ssr/QrCode";
import { Receipt as PhReceipt } from "@phosphor-icons/react/dist/ssr/Receipt";
import { Repeat as PhRepeat } from "@phosphor-icons/react/dist/ssr/Repeat";
import { ShareNetwork as PhShareNetwork } from "@phosphor-icons/react/dist/ssr/ShareNetwork";
import { ShieldCheck as PhShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { ShieldSlash as PhShieldSlash } from "@phosphor-icons/react/dist/ssr/ShieldSlash";
import { SignOut as PhSignOut } from "@phosphor-icons/react/dist/ssr/SignOut";
import { SlidersHorizontal as PhSlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import { SmileyMeh as PhSmileyMeh } from "@phosphor-icons/react/dist/ssr/SmileyMeh";
import { SealPercent as PhSealPercent } from "@phosphor-icons/react/dist/ssr/SealPercent";
import { Sparkle as PhSparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { SpeakerHigh as PhSpeakerHigh } from "@phosphor-icons/react/dist/ssr/SpeakerHigh";
import { SpeakerSlash as PhSpeakerSlash } from "@phosphor-icons/react/dist/ssr/SpeakerSlash";
import { SquaresFour as PhSquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { Star as PhStar } from "@phosphor-icons/react/dist/ssr/Star";
import { StarHalf as PhStarHalf } from "@phosphor-icons/react/dist/ssr/StarHalf";
import { Sun as PhSun } from "@phosphor-icons/react/dist/ssr/Sun";
import { SunDim as PhSunDim } from "@phosphor-icons/react/dist/ssr/SunDim";
import { SunHorizon as PhSunHorizon } from "@phosphor-icons/react/dist/ssr/SunHorizon";
import { Timer as PhTimer } from "@phosphor-icons/react/dist/ssr/Timer";
import { Trash as PhTrash } from "@phosphor-icons/react/dist/ssr/Trash";
import { Tray as PhTray } from "@phosphor-icons/react/dist/ssr/Tray";
import { Trophy as PhTrophy } from "@phosphor-icons/react/dist/ssr/Trophy";
import { User as PhUser } from "@phosphor-icons/react/dist/ssr/User";
import { Users as PhUsers } from "@phosphor-icons/react/dist/ssr/Users";
import { WarningCircle as PhWarningCircle } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { WhatsappLogo as PhWhatsappLogo } from "@phosphor-icons/react/dist/ssr/WhatsappLogo";
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X";

export type { IconProps };
/** Any icon from this file — for props like EmptyState's `icon`. */
export type AppIcon = ComponentType<IconProps>;

function make(Ph: PhosphorIcon, name: string, defaultWeight: IconProps["weight"] = "duotone"): AppIcon {
  function AppIcon({ size = 24, weight = defaultWeight, ...props }: IconProps) {
    const labelled = Boolean(props["aria-label"] || props["aria-labelledby"] || props.alt);
    return <Ph size={size} weight={weight} aria-hidden={labelled ? undefined : true} {...props} />;
  }
  AppIcon.displayName = name;
  return AppIcon;
}

/** discount offers (cart, admin) */
export const Discount = make(PhSealPercent, "Discount");
/** error toasts */
export const AlertCircle = make(PhWarningCircle, "AlertCircle");
/** fruit categories */
export const Apple = make(PhOrange, "Apple");
/** back */
export const ArrowLeft = make(PhArrowLeft, "ArrowLeft", "bold");
/** go / continue */
export const ArrowRight = make(PhArrowRight, "ArrowRight", "bold");
/** sort */
export const ArrowsDownUp = make(PhArrowsDownUp, "ArrowsDownUp");
/** Centurion milestone */
export const Award = make(PhMedal, "Award");
/** cash at pickup */
export const Banknote = make(PhMoney, "Banknote");
/** notifications on */
export const Bell = make(PhBell, "Bell");
/** notifications off */
export const BellOff = make(PhBellSlash, "BellOff");
/** admin alerts armed */
export const BellRing = make(PhBellRinging, "BellRing");
/** Thursday special */
export const CalendarHeart = make(PhCalendarHeart, "CalendarHeart");
/** done / confirm */
export const Check = make(PhCheck, "Check", "bold");
/** success toasts */
export const CheckCircle2 = make(PhCheckCircle, "CheckCircle2");
/** shadcn menu check */
export const CheckIcon = make(PhCheck, "CheckIcon", "bold");
/** preparing / Campus Foodie */
export const ChefHat = make(PhChefHat, "ChefHat");
/** disclosure */
export const ChevronDown = make(PhCaretDown, "ChevronDown", "bold");
/** row chevron */
export const ChevronRight = make(PhCaretRight, "ChevronRight", "bold");
/** shadcn submenu */
export const ChevronRightIcon = make(PhCaretRight, "ChevronRightIcon", "bold");
/** juices */
export const Citrus = make(PhOrangeSlice, "Citrus");
/** Campus Explorer */
export const Compass = make(PhCompass, "Compass");
/** biryani / rice */
export const CookingPot = make(PhCookingPot, "CookingPot");
/** copy order text */
export const Copy = make(PhCopy, "Copy");
/** Gate Legend */
export const Crown = make(PhCrown, "Crown");
/** export */
export const Download = make(PhDownloadSimple, "Download");
/** email */
export const Mail = make(PhEnvelopeSimple, "Mail");
/** non-veg (chicken) */
export const Drumstick = make(PhBird, "Drumstick");
/** trending */
export const Flame = make(PhFire, "Flame");
/** free biryani reward */
export const Gift = make(PhGift, "Gift");
/** sugarcane / drinks */
export const GlassWater = make(PhPintGlass, "GlassWater");
/** order history */
export const History = make(PhClockCounterClockwise, "History");
/** no orders */
export const Inbox = make(PhTray, "Inbox");
/** all categories */
export const LayoutGrid = make(PhSquaresFour, "LayoutGrid");
/** veg */
export const Leaf = make(PhLeaf, "Leaf");
/** spinner (use with animate-spin) */
export const Loader2 = make(PhCircleNotch, "Loader2");
/** locked */
export const Lock = make(PhLockSimple, "Lock");
/** sign out */
export const LogOut = make(PhSignOut, "LogOut");
/** Gate 3 */
export const MapPin = make(PhMapPin, "MapPin");
/** WhatsApp buttons */
export const MessageCircle = make(PhWhatsappLogo, "MessageCircle");
/** review notes */
export const MessageSquareText = make(PhChatCenteredText, "MessageSquareText");
/** stepper */
export const Minus = make(PhMinus, "Minus", "bold");
/** system theme */
export const Monitor = make(PhMonitor, "Monitor");
/** dark theme */
export const Moon = make(PhMoon, "Moon");
/** the delivery scooter on the order road (faces right) */
export const Moped = make(PhMoped, "Moped");
/** night greeting */
export const MoonStars = make(PhMoonStars, "MoonStars");
/** sold out */
export const PackageX = make(PhProhibit, "PackageX");
/** theme picker */
export const Palette = make(PhPalette, "Palette");
/** call */
export const Phone = make(PhPhone, "Phone");
/** add / stepper */
export const Plus = make(PhPlus, "Plus", "bold");
/** ordering switch */
export const Power = make(PhPower, "Power");
/** UPI at pickup */
export const QrCode = make(PhQrCode, "QrCode");
/** orders */
export const Receipt = make(PhReceipt, "Receipt");
/** reordered / Regular */
export const Repeat = make(PhRepeat, "Repeat");
/** reorder */
export const RotateCcw = make(PhArrowCounterClockwise, "RotateCcw");
/** reload */
export const RotateCw = make(PhArrowClockwise, "RotateCw");
/** search */
export const Search = make(PhMagnifyingGlass, "Search");
/** no results */
export const SearchX = make(PhSmileyMeh, "SearchX");
/** filters */
export const SlidersHorizontal = make(PhSlidersHorizontal, "SlidersHorizontal");
/** share token */
export const Share2 = make(PhShareNetwork, "Share2");
/** banned users */
export const ShieldBan = make(PhShieldSlash, "ShieldBan");
/** unban */
export const ShieldCheck = make(PhShieldCheck, "ShieldCheck");
/** curries / noodles */
export const Soup = make(PhBowlSteam, "Soup");
/** rank highlight */
export const Sparkle = make(PhSparkle, "Sparkle");
/** specials */
export const Sparkles = make(PhSparkle, "Sparkles");
/** ratings (icon-solid when filled) */
export const Star = make(PhStar, "Star");
/** half-star averages */
export const StarHalf = make(PhStarHalf, "StarHalf");
/** light theme / afternoon */
export const Sun = make(PhSun, "Sun");
/** morning greeting */
export const Sunrise = make(PhSunHorizon, "Sunrise");
/** evening greeting */
export const Sunset = make(PhSunDim, "Sunset");
/** delivery time */
export const Timer = make(PhTimer, "Timer");
/** remove from cart */
export const Trash2 = make(PhTrash, "Trash2");
/** weekly rank */
export const Trophy = make(PhTrophy, "Trophy");
/** profile */
export const User = make(PhUser, "User");
/** admin users */
export const Users = make(PhUsers, "Users");
/** food */
export const Utensils = make(PhForkKnife, "Utensils");
/** starters / First Bite */
export const UtensilsCrossed = make(PhBowlFood, "UtensilsCrossed");
/** sound on */
export const Volume2 = make(PhSpeakerHigh, "Volume2");
/** sound off */
export const VolumeX = make(PhSpeakerSlash, "VolumeX");
/** breads */
export const Wheat = make(PhGrains, "Wheat");
/** close / clear */
export const X = make(PhX, "X", "bold");
/** shadcn close */
export const XIcon = make(PhX, "XIcon", "bold");

/** avatars (taste profile) */
export const Carrot = make(PhCarrot, "Carrot");
export const Coffee = make(PhCoffee, "Coffee");
export const Cookie = make(PhCookie, "Cookie");
export const Egg = make(PhEgg, "Egg");
export const Hamburger = make(PhHamburger, "Hamburger");
export const IceCream = make(PhIceCream, "IceCream");
/** spice level, avatars */
export const Pepper = make(PhPepper, "Pepper");
export const Pizza = make(PhPizza, "Pizza");
export const Popcorn = make(PhPopcorn, "Popcorn");
/** like a dish (hearts) */
export const Heart = make(PhHeart, "Heart");
/** edit taste profile */
export const PencilSimple = make(PhPencilSimple, "PencilSimple");
