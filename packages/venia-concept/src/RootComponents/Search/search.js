import React, { Component } from 'react';
import { withRouter } from 'react-router';

import { Query } from 'react-apollo';
import Gallery from 'src/components/Gallery';
import gql from 'graphql-tag';
import classify from 'src/classify';
import defaultClasses from './search.css';

const searchQuery = gql`
    query($inputText: String) {
        products(search: $inputText) {
            items {
                id
                name
                small_image
                url_key
                price {
                    regularPrice {
                        amount {
                            value
                            currency
                        }
                    }
                }
            }
            total_count
        }
    }
`;

export class Search extends Component {
    render() {
        const { classes } = this.props;

        let inputText = '';
        if (location.search) {
            const params = new URLSearchParams(location.search);
            inputText = params.get('query');
        }

        return (
            <Query query={searchQuery} variables={{ inputText: inputText }}>
                {({ loading, error, data }) => {
                    if (error) return <div>Data Fetch Error</div>;
                    if (loading) return <div>Fetching Data</div>;
                    if (data.products.items.length === 0)
                        return (
                            <div className={classes.noResult}>
                                No results found!
                            </div>
                        );

                    return (
                        <article className={classes.root}>
                            <div className={classes.totalPages}>
                                <span>{`${
                                    data.products.total_count
                                } items`}</span>
                            </div>
                            <section className={classes.gallery}>
                                <Gallery data={data.products.items} />
                            </section>
                        </article>
                    );
                }}
            </Query>
        );
    }
}

export default withRouter(classify(defaultClasses)(Search));