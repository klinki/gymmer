let data = {};

for (let training of data.trainings) {
  for (let exercise of training.exercises) {
    for (let serie of exercise.series) {
      if (serie.weight == 0) {
        serie.weight = serie.note;
      }
    }
  }
}
