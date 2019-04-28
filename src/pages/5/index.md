---
path: "/thompson-sampling"
date: "2019-04-27"
title: "Thompson Sampling for Restaurant Recommendations"
tags: ['Data Science']
---

In a recent conversation in the Recurse Center kitchen, a group of us were discussing the difficulty of figuring out where to go for lunch. Someone suggested we just make a chat bot that tells you where to go, randomly cycling through all the restaurants within a certain radius of RC. I started thinking about what would make the bot better than random - ideally, it would somehow balance pushing you out of your comfort zone by suggesting new restaurants and lean toward suggesting the best restaurants.

Then it hit me that this is the exact tradeoff between exploitation and exploration made in the Multi-Armed Bandit problem, and that we could use Thompson Sampling to recommend the restaurants. I got more curious about how Thompson Sampling actually worked, and made an interactive visualization to help understand how it would choose which restaurant to recommend.

The gist of the Multi-Armed Bandit problem is that there's a series of slot machines that all have different probabilities of giving you a payout, or reward. You don't know what those probabilities are, and you can only start to learn by actually playing them. Over a series of plays, your goal is to maximize your total reward by choosing the best slot machine.

We can think of the restaurants we'd like to recommend as having an unknown chance of reward (the probability a randomly chosen person will like it), and each time we recommend a restaurant, we're choosing a slot machine. Users can give us some signal like a page view or "like" that counts as a reward. In the case of this visualization, we'll use upvotes and downvotes.

<iframe style="margin: 0 auto; display: block" src="/thompsonSampling" width="850" height="425"></iframe>

## Modelling Uncertainty

Two crucial points:

* As we play the slot machines, data will start coming in that we can use to estimate each machine's probability of reward. But we need to be careful not to over-generalize about this data, because it's tainted by randomness. I think the restaurant model is actually a good way to think about this. If you get one upvote, are you comfortable saying that the restaurant is good? I wouldn't be, because the data point could just be from a user with low standards or who has some direct connection to the restaurant. We need to build some uncertainty about whether our data is telling the whole story into our model.
* You want to make a tradeoff between _exploiting_ a slot machine that's believed to have a high probability of giving a reward, and _exploring_ slot machines that you don't have much data for, since they could turn out to be the best ones.

One specific peril that I think is interesting: when we stop playing a machine because we estimate it to have a low chance of reward, we'll also stop learning anything about it. Once we write-off a specific slot machine as having bad mojo, nothing will convince us we're wrong. On the other hand, if we erroneously decide a slot machine is good, we'll keep playing it until we become convinced that our previous data was misleading.

So as we continue to make decisions and get feedback from those decisions, we want to treat the probability of getting award from each restaurant as something hazy and uncertain. If we recommend a restaurant and get three upvotes, we don't our model to make an overly confident claim like "There's a 100% chance someone will like the restaurant."

Instead, we want to think about there being a _range_ of possible probabilities, some more likely than others. For example, just pulling reasonable numbers out of thin air, we might say that there's a 0% chance that 0% of people like the restaurant, a 20% chance that 0-50% of people like the restaurant, a 30% chance that 50-75% of people like it, and a 50% chance that 75-100% of people like it.

In other words, we want to start assigning probabilities to each possible probability of reward (by definition, the range of numbers between 0 and 1) in order to quantify our degree of certainty that they represent the _true_ probability of reward.

There are two ways to represent this. What I did is create a list of 100 discrete whole number probabilities between 0 and 1, so 0, 0.01, 0.02, 0.03 ... 1.0. Those probabilities are shown on the x axis in the graphs in the visualization above.

In reality, there are infinite numbers between 0 and 1 - there could be a 0.000034 probability of reward, which does not appear as a point in my graphs. Most discussions of Thompson Sampling use some sort of continuous function like this thing called the Beta distribution to model this. Because I wanted to get an intuitive sense for how Thompson Sampling works, and I didn't find the Beta distribution intuitive, I stayed away from it and stuck to discrete numbers.

## Updating Our Model

Okay, so we know what shape we want our model to take - for each restaurant, we want a pair of values that we can graph. We want the x axis to be the 100 evenly spaced numbers between 0 and 1 and we want the y axis to represent the probability each of those x axis values is the correct probability. As we start getting upvotes and downvotes, we want to update each of these pairs of values for the corresponding restaurant to reflect how likely each individual probability is to be correct.

But how do we do this update? And what values do we start with? We coul do a couple different things to start. We could start with a "uniform" distribution, meaning we treat every probability as equally likely until we get any evidence. I opted to start with a triangular distribution, starting out with the rating provided by the Google places API as the most likely probability, with the probability gradually decreasing toward the left and right.

Now each time someone gives a restaurant an upvote or downvote, we need to iterate over all the x values and adjust the corresponding y values in light of the new evidence. To do this, we can use a delightful equation called Bayes' Theorem.

This is Bayes' Theorem:

`p(H|D) = (p(D|H) * p(H)) / p(D)`

Let's break it down:

### p(H)

I think the easiest term to explain first is what's called the "prior". This is the probability of a specific hypothesis being true before we receive the new data. In our case, we have 101 hypotheses for each restaurant - for example "80% of people like Hanco's" is an example of a hypothesis, as is "81% of people like Hanco's", and so on. So this is the probability that a specific probability is correct for a specific restaurant.

### p(D|H)

This is the probability, or likelihood, of the new data we've received (a reward or lack of reward) according to a specific hypothesis. Remember, each hypothesis says something like "80% of a people like Hanco's." So if our new data is an upvote, the hypothesis would say that there's an 80% chance of seeing that data, so this value would be 0.8. If the data is the upvote, that's just the opposite of the hypothesis, so the probability of seeing a downvote would be 0.2.

### p(H|D)

This is the "posterior" probability that the hypothesis we're interested in is true. This is what we want to find out - how should we update the probability that this probability is correct in light of a new upvote or downvote.

### p(D|H) * p(H)

This is the joint probability of two things happening: the specific hypothesis we're interested in being true _and_ the data point we're responding to occurring.

### p(D)

This denominator is the likelihood of receiving this data according to _any_ of the valid hypotheses. It serves as a "normalizing constant", causing all the `p(H|D)` for this restaurant to add up to, or "integrate" (if you speak math, I'm trying not to make assumptions), to 1.

This is the sum of the probabilities of _all_ possible hypotheses about this restaurant. So to get this, we can just go over each hypothesis for the restaurant, compute `p(D|H) * p(H)`, and add all the results up.

After we've found `p(H|D)` for every probability from 0% to 100%, we're ready to render the new graph! It's probably not intuitive form Bayes' Theorem how upvotes and downvotes cause the graph to change. Try playing around with the above UI:

* Give Hanco's one upvote and one downvote
* Give Yemen Cafe five upvotes and five downvotes.

Notice the difference in the resulting graphs. Hanco's should now have a pretty flat curve while Yemen Cafe should have a steeper curve with a narrower "bell" shape. If we were to just naively generalize about the probability of reward for these two restaurants, we'd evaluate the "maximum likelihood" and get the same number for both, which is 50%. But in reality, our information about Yemen Cafe is slightly richer and more generalizable than our information about Hanco's, and two graphed distributions allow us to quanify this. Just eyeballing the two curves, it look the majority of the area under Yemen Cafe's curve falls between 40% and 70%. So we can feel pretty certain there's a 40% to 70% chance someone will like Yemen Cafe. The equivalent spread for Hanco's is much wider, maybe something like 30% to 80%, meaning we know extreme probabilities close to 100% and 0% are unlikely, but what we _really_ want is more information before we're willing to extrapolate about whether Hanco's is popular or not.

## Making a Prediction

Here's where things get extra fun. In order to get a restaurant recommendation, we first sample from each distribution. This means we randomly pick a probability for each restaurant, but this randomness is weighted by the corresponding y value for each probability. So if we sample over and over again, we'll notice that we more frequently receive a value closer to the peaks of each graph. In other words, we'll choose the probability we're most confident about more frequently, but we'll occasionally pick a probability that's plausible, but less likely.

When you click "Get Recommendation" on the visualization above, you'll see that the randomly sampled points on each curve are highlighted.

After we've sampled for each restaurant, all we do is pick the maximum probability that we sampled! So take an example like this one...

<img src="/images/thompson_sampling.svg" height="60%" width="60%" style="margin: 0 auto; display: block" />

In this state of the system, we feel pretty sure that Sophie's is popular and pretty sure that Yemen Cafe is not, but we're not confident we know how many people in the broader population like Hanco's. The Thompson Sampling technique allows us to intelligently alternate between the two competing strategies here: _exploring_ for more data about Hanco's and _exploiting_ our knowledge that Sophie's is a safe bet.

Notice how at this point Yemen Cafe's graph barely intersects with the Sophie's graph. In order for Yemen Cafe to be recommended, we'd need to get extremely unlucky. We'd need to randomly sample a point on that tiny sliver on the Yemen Cafe graph that's to the right of where the it overlaps with Sophie's, and we'd also need to sample a point on the tiny sliver of the Sophie's graph that's to the left of that intersection point. _And_ - this is much more likely as a standalone event - we'd need to sample a point on the Hanco's graph that's to the left of the point we choose for Yemen Cafe.

## Production

This is just a toy demo, but it's interesting to think about how Thompson Sampling would be scaled to choose between many restaurants. Randomly sampling between probabilities isn't something that can easily be computed ahead of time and cached. It strikes me as a perfect problem for map-reduce! We could store the parameters to a Beta distribution for each restaurant under a key on different database partitions, and to make a prediction, we could fan out to those partitions to have the nodes randomly sample from the distributions (the map phase). The reduce phase then simply consists of folding all the results into a maximum value.