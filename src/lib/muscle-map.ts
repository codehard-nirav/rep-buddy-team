// Maps our exercise muscle tokens to bodymap image filenames from OpenLyfta assets.
// Files live at /bodymaps/{male|female}/{filename}.webp

const MALE_MAP: Record<string, string> = {
  chest: "front_chest",
  shoulders: "front_deltoids",
  rear_delts: "back_deltoids",
  triceps: "back_triceps",
  biceps: "front_biceps",
  forearms: "front_wrist_extensors",
  lats: "back_latissimus_dorsi",
  back: "back_middle_trapezius",
  traps: "back_upper_trapezius",
  lower_back: "back_erector_spinae",
  core: "front_rectus_abdominis",
  obliques: "front_obliques",
  quadriceps: "front_quadriceps",
  hamstrings: "back_hamstrings",
  glutes: "back_gluteus_maximus",
  calves: "back_gastrocnemius",
  hip_flexors: "front_iliopsoas",
  hip_adductors: "back_hip_adductors",
  legs: "front_quadriceps",
};

const FEMALE_MAP: Record<string, string> = {
  chest: "front_chest_female",
  shoulders: "front_deltoid_anterior_female",
  rear_delts: "back_deltoid_female",
  triceps: "back_triceps_female",
  biceps: "front_biceps_female",
  forearms: "front_wrist_extensors_female",
  lats: "back_latissimus_dorsi_female",
  back: "back_trapezius_female",
  traps: "back_trapezius_female",
  lower_back: "back_erector_spinae_female",
  core: "front_rectus_abdominis_female",
  obliques: "front_obliques_female",
  quadriceps: "front_quadriceps_female",
  hamstrings: "back_hamstrings_female",
  glutes: "back_gluteus_maximus_female",
  calves: "back_gastrocnemius_female",
  hip_flexors: "front_iliopsoas_female",
  hip_adductors: "back_hip_adductors_female",
  legs: "front_quadriceps_female",
};

export type Sex = "male" | "female";

export function bodyBaseUrls(sex: Sex) {
  return sex === "female"
    ? {
        front: "/bodymaps/female/front_grey_body_female.webp",
        back: "/bodymaps/female/back_gray_body_female.webp",
      }
    : {
        front: "/bodymaps/male/front_grey_body.webp",
        back: "/bodymaps/male/back_grey_body.webp",
      };
}

export function muscleOverlayUrls(muscles: string[], sex: Sex = "male"): string[] {
  const map = sex === "female" ? FEMALE_MAP : MALE_MAP;
  const dir = sex === "female" ? "female" : "male";
  return muscles
    .map((m) => map[m])
    .filter(Boolean)
    .map((f) => `/bodymaps/${dir}/${f}.webp`);
}

export function prettyMuscle(m: string) {
  return m
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
